import { Injectable, Logger, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { QuickBooksApiClient, QBTokens, QBInvoice, QBCustomer } from './quickbooks-api.client';
import { randomBytes } from 'crypto';

export interface ConnectionStatus {
    isConnected: boolean;
    companyName?: string;
    realmId?: string;
    environment: 'sandbox' | 'production';
    tokenExpiry?: Date;
    lastSyncAt?: Date;
}

export interface SyncResult {
    success: boolean;
    message: string;
    syncedCount?: number;
    errors?: string[];
}

export interface DiscountHelperResult {
    customer: {
        id: string;
        name: string;
        phone: string;
        email?: string;
        type: string;
        qbCustomerId?: string;
    };
    discounts: {
        memberDiscount: number;
        customDiscountCode?: string;
        customDiscountRate?: number;
        availablePoints: number;
        pointsValue: number; // Dollar value of points
        promoCodes: Array<{
            code: string;
            discountPercent: number;
            description?: string;
            expiresAt?: Date;
        }>;
    };
    summary: string;
}

@Injectable()
export class QuickBooksService {
    private readonly logger = new Logger(QuickBooksService.name);
    private oauthStates: Map<string, { timestamp: number }> = new Map();

    constructor(
        private prisma: PrismaService,
        private qbClient: QuickBooksApiClient,
        private configService: ConfigService,
    ) {
        // Clean up expired OAuth states every 5 minutes
        setInterval(() => this.cleanupOAuthStates(), 5 * 60 * 1000);
    }

    /**
     * Get OAuth authorization URL
     */
    getAuthUrl(): { url: string; state: string } {
        const state = randomBytes(16).toString('hex');
        this.oauthStates.set(state, { timestamp: Date.now() });

        const url = this.qbClient.getAuthorizationUrl(state);

        return { url, state };
    }

    /**
     * Handle OAuth callback
     */
    async handleCallback(code: string, realmId: string, state: string): Promise<ConnectionStatus> {
        // Validate state
        const storedState = this.oauthStates.get(state);
        if (!storedState) {
            throw new UnauthorizedException('Invalid or expired OAuth state');
        }

        // Check if state is not too old (15 minutes)
        if (Date.now() - storedState.timestamp > 15 * 60 * 1000) {
            this.oauthStates.delete(state);
            throw new UnauthorizedException('OAuth state expired');
        }

        this.oauthStates.delete(state);

        // Exchange code for tokens
        const tokens = await this.qbClient.exchangeCodeForTokens(code, realmId);

        // Get company info
        const companyInfo = await this.qbClient.getCompanyInfo(tokens.accessToken, realmId);

        // Save or update connection
        await this.prisma.quickBooksConnection.upsert({
            where: { realmId },
            update: {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                tokenExpiry: tokens.tokenExpiry,
                companyName: companyInfo.companyName,
                isActive: true,
            },
            create: {
                realmId,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                tokenExpiry: tokens.tokenExpiry,
                companyName: companyInfo.companyName,
                isActive: true,
            },
        });

        this.logger.log(`Connected to QuickBooks company: ${companyInfo.companyName}`);

        return {
            isConnected: true,
            companyName: companyInfo.companyName,
            realmId,
            environment: this.qbClient.getEnvironment(),
            tokenExpiry: tokens.tokenExpiry,
        };
    }

    /**
     * Get current connection status
     */
    async getConnectionStatus(): Promise<ConnectionStatus> {
        const connection = await this.prisma.quickBooksConnection.findFirst({
            where: { isActive: true },
            orderBy: { updatedAt: 'desc' },
        });

        if (!connection) {
            return {
                isConnected: false,
                environment: this.qbClient.getEnvironment(),
            };
        }

        // Check if token is expired
        const isExpired = connection.tokenExpiry < new Date();

        if (isExpired) {
            // Try to refresh token
            try {
                await this.refreshTokenIfNeeded(connection.id);
                const refreshedConnection = await this.prisma.quickBooksConnection.findUnique({
                    where: { id: connection.id },
                });

                return {
                    isConnected: true,
                    companyName: refreshedConnection?.companyName || undefined,
                    realmId: refreshedConnection?.realmId,
                    environment: this.qbClient.getEnvironment(),
                    tokenExpiry: refreshedConnection?.tokenExpiry,
                };
            } catch {
                return {
                    isConnected: false,
                    environment: this.qbClient.getEnvironment(),
                };
            }
        }

        return {
            isConnected: true,
            companyName: connection.companyName || undefined,
            realmId: connection.realmId,
            environment: this.qbClient.getEnvironment(),
            tokenExpiry: connection.tokenExpiry,
        };
    }

    /**
     * Disconnect from QuickBooks
     */
    async disconnect(): Promise<void> {
        const connection = await this.prisma.quickBooksConnection.findFirst({
            where: { isActive: true },
        });

        if (!connection) {
            throw new NotFoundException('No active QuickBooks connection');
        }

        // Revoke token
        try {
            await this.qbClient.revokeToken(connection.refreshToken);
        } catch (error) {
            this.logger.warn('Failed to revoke token, continuing with disconnect');
        }

        // Mark as inactive
        await this.prisma.quickBooksConnection.update({
            where: { id: connection.id },
            data: { isActive: false },
        });

        this.logger.log('Disconnected from QuickBooks');
    }

    /**
     * Refresh access token if needed
     */
    async refreshTokenIfNeeded(connectionId?: string): Promise<void> {
        const connection = connectionId
            ? await this.prisma.quickBooksConnection.findUnique({ where: { id: connectionId } })
            : await this.prisma.quickBooksConnection.findFirst({ where: { isActive: true } });

        if (!connection) {
            throw new NotFoundException('No QuickBooks connection found');
        }

        // Check if token needs refresh (expires in less than 10 minutes)
        const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);

        if (connection.tokenExpiry > tenMinutesFromNow) {
            return; // Token is still valid
        }

        // Refresh token
        const newTokens = await this.qbClient.refreshAccessToken(connection.refreshToken);

        await this.prisma.quickBooksConnection.update({
            where: { id: connection.id },
            data: {
                accessToken: newTokens.accessToken,
                refreshToken: newTokens.refreshToken,
                tokenExpiry: newTokens.tokenExpiry,
            },
        });

        this.logger.log('Refreshed QuickBooks access token');
    }

    /**
     * Get active connection with valid tokens
     */
    async getActiveConnection(): Promise<{ accessToken: string; realmId: string }> {
        const connection = await this.prisma.quickBooksConnection.findFirst({
            where: { isActive: true },
        });

        if (!connection) {
            throw new NotFoundException('No active QuickBooks connection');
        }

        // Ensure token is fresh
        await this.refreshTokenIfNeeded(connection.id);

        // Fetch updated connection
        const updated = await this.prisma.quickBooksConnection.findUnique({
            where: { id: connection.id },
        });

        if (!updated) {
            throw new NotFoundException('Connection not found after refresh');
        }

        return {
            accessToken: updated.accessToken,
            realmId: updated.realmId,
        };
    }

    /**
     * Sync customers from QuickBooks
     */
    async syncCustomers(): Promise<SyncResult> {
        const { accessToken, realmId } = await this.getActiveConnection();

        const errors: string[] = [];
        let syncedCount = 0;
        let startPosition = 1;
        const maxResults = 100;

        try {
            while (true) {
                const qbCustomers = await this.qbClient.queryCustomers(accessToken, realmId, startPosition, maxResults);

                if (qbCustomers.length === 0) {
                    break;
                }

                for (const qbCustomer of qbCustomers) {
                    try {
                        await this.syncSingleCustomer(qbCustomer);
                        syncedCount++;
                    } catch (error) {
                        const msg = `Failed to sync customer ${qbCustomer.Id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                        this.logger.error(msg);
                        errors.push(msg);
                    }
                }

                if (qbCustomers.length < maxResults) {
                    break;
                }

                startPosition += maxResults;
            }

            await this.logSync('CUSTOMER', 'BATCH', 'SYNC', 'SUCCESS', syncedCount, null);

            return {
                success: true,
                message: `Synced ${syncedCount} customers`,
                syncedCount,
                errors: errors.length > 0 ? errors : undefined,
            };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            await this.logSync('CUSTOMER', 'BATCH', 'SYNC', 'FAILED', 0, errorMsg);

            return {
                success: false,
                message: `Customer sync failed: ${errorMsg}`,
                errors: [errorMsg],
            };
        }
    }

    /**
     * Sync a single customer from QuickBooks
     */
    private async syncSingleCustomer(qbCustomer: QBCustomer): Promise<void> {
        const phone = qbCustomer.PrimaryPhone?.FreeFormNumber?.replace(/\D/g, '') || '';
        const email = qbCustomer.PrimaryEmailAddr?.Address;

        // Try to find existing customer by QB ID or phone/email
        let existingCustomer = await this.prisma.customer.findFirst({
            where: {
                OR: [
                    { qbCustomerId: qbCustomer.Id },
                    ...(phone ? [{ phone }] : []),
                    ...(email ? [{ email }] : []),
                ],
            },
        });

        if (existingCustomer) {
            // Update QB customer ID if not set
            if (!existingCustomer.qbCustomerId) {
                await this.prisma.customer.update({
                    where: { id: existingCustomer.id },
                    data: { qbCustomerId: qbCustomer.Id },
                });
            }
        } else {
            // Create new customer
            await this.prisma.customer.create({
                data: {
                    name: qbCustomer.DisplayName,
                    phone: phone || 'N/A',
                    email: email,
                    qbCustomerId: qbCustomer.Id,
                    type: 'REGULAR',
                },
            });
        }
    }

    /**
     * Sync orders from QuickBooks invoices
     */
    async syncOrders(modifiedAfter?: string): Promise<SyncResult> {
        const { accessToken, realmId } = await this.getActiveConnection();

        const errors: string[] = [];
        let syncedCount = 0;

        try {
            const invoices = await this.qbClient.queryInvoices(accessToken, realmId, { modifiedAfter });

            for (const invoice of invoices) {
                try {
                    await this.syncSingleInvoice(invoice);
                    syncedCount++;
                } catch (error) {
                    const msg = `Failed to sync invoice ${invoice.Id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    this.logger.error(msg);
                    errors.push(msg);
                }
            }

            await this.logSync('INVOICE', 'BATCH', 'SYNC', 'SUCCESS', syncedCount, null);

            return {
                success: true,
                message: `Synced ${syncedCount} orders`,
                syncedCount,
                errors: errors.length > 0 ? errors : undefined,
            };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            await this.logSync('INVOICE', 'BATCH', 'SYNC', 'FAILED', 0, errorMsg);

            return {
                success: false,
                message: `Order sync failed: ${errorMsg}`,
                errors: [errorMsg],
            };
        }
    }

    /**
     * Sync a single invoice from QuickBooks
     */
    private async syncSingleInvoice(invoice: QBInvoice): Promise<void> {
        // Find customer by QB ID
        let customer = await this.prisma.customer.findFirst({
            where: { qbCustomerId: invoice.CustomerRef.value },
        });

        if (!customer) {
            // Create customer from invoice
            customer = await this.prisma.customer.create({
                data: {
                    name: invoice.CustomerRef.name,
                    phone: 'N/A',
                    qbCustomerId: invoice.CustomerRef.value,
                    type: 'REGULAR',
                },
            });
        }

        // Parse discount from invoice lines
        let discountAmount = 0;
        let discountCode: string | null = null;
        const items: Array<{ name: string; quantity: number; unitPrice: number; total: number }> = [];

        for (const line of invoice.Line) {
            if (line.DetailType === 'DiscountLineDetail') {
                discountAmount = line.Amount;
            } else if (line.SalesItemLineDetail) {
                items.push({
                    name: line.Description || line.SalesItemLineDetail.ItemRef.name,
                    quantity: line.SalesItemLineDetail.Qty,
                    unitPrice: line.SalesItemLineDetail.UnitPrice,
                    total: line.Amount,
                });
            }
        }

        // Check memo for discount code
        if (invoice.CustomerMemo?.value) {
            const memoMatch = invoice.CustomerMemo.value.match(/CODE:\s*(\w+)/i);
            if (memoMatch) {
                discountCode = memoMatch[1];
            }
        }

        // Calculate amounts
        const totalBeforeDiscount = invoice.TotalAmt + discountAmount;
        const amountAfterDiscount = invoice.TotalAmt;

        // Determine order status based on balance
        const status = invoice.Balance === 0 ? 'COMPLETED' : 'PENDING';

        // Upsert order
        const existingOrder = await this.prisma.order.findFirst({
            where: { qbId: invoice.Id },
        });

        if (existingOrder) {
            await this.prisma.order.update({
                where: { id: existingOrder.id },
                data: {
                    total: totalBeforeDiscount,
                    amount: amountAfterDiscount,
                    status,
                    syncStatus: 'SYNCED',
                    qbSyncedAt: new Date(),
                    discountCode,
                },
            });
        } else {
            const order = await this.prisma.order.create({
                data: {
                    qbId: invoice.Id,
                    qbInvoiceId: invoice.DocNumber,
                    customerId: customer.id,
                    customerName: customer.name,
                    total: totalBeforeDiscount,
                    amount: amountAfterDiscount,
                    status,
                    syncStatus: 'SYNCED',
                    qbSyncedAt: new Date(),
                    discountCode,
                },
            });

            // Create order items
            for (const item of items) {
                await this.prisma.orderItem.create({
                    data: {
                        orderId: order.id,
                        name: item.name,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        total: item.total,
                    },
                });
            }

            // Handle discount code usage if present
            if (discountCode && status === 'COMPLETED') {
                await this.recordDiscountCodeUsage(discountCode, customer.id, order.id, amountAfterDiscount, discountAmount);
            }

            // Award points if order is completed
            if (status === 'COMPLETED') {
                await this.awardPointsForOrder(customer.id, amountAfterDiscount);
            }
        }
    }

    /**
     * Record discount code usage
     */
    private async recordDiscountCodeUsage(
        code: string,
        customerId: string,
        orderId: string,
        orderTotal: number,
        discountAmount: number
    ): Promise<void> {
        const discountCode = await this.prisma.discountCode.findUnique({
            where: { code: code.toUpperCase() },
        });

        if (!discountCode) {
            this.logger.warn(`Discount code ${code} not found in database`);
            return;
        }

        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
        });

        if (!customer) return;

        await this.prisma.discountCodeUsage.create({
            data: {
                discountCodeId: discountCode.id,
                customerId,
                customerName: customer.name,
                customerType: customer.type,
                orderId,
                orderTotal,
                discountAmount,
            },
        });

        // Update usage count
        await this.prisma.discountCode.update({
            where: { id: discountCode.id },
            data: {
                usageCount: { increment: 1 },
            },
        });
    }

    /**
     * Award points for completed order
     */
    private async awardPointsForOrder(customerId: string, orderAmount: number): Promise<void> {
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
        });

        if (!customer) return;

        // Get active points rule for customer type
        const pointsRule = await this.prisma.pointsRule.findFirst({
            where: {
                isActive: true,
                customerTypes: { has: customer.type },
            },
        });

        if (!pointsRule) return;

        // Calculate points (e.g., 1 point per dollar, based on earnRate percentage)
        const pointsEarned = Math.floor(Number(orderAmount) * pointsRule.earnRate / 100);

        if (pointsEarned <= 0) return;

        // Create points transaction
        await this.prisma.pointsTransaction.create({
            data: {
                customerId,
                amount: pointsEarned,
                type: 'EARN',
                description: `Points earned from order (${orderAmount.toFixed(2)})`,
            },
        });

        // Update customer points
        await this.prisma.customer.update({
            where: { id: customerId },
            data: {
                points: { increment: pointsEarned },
            },
        });
    }

    /**
     * Handle webhook from QuickBooks
     */
    async handleWebhook(payload: string, signature: string): Promise<void> {
        const verifierToken = this.configService.get<string>('QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN', '');

        if (!this.qbClient.verifyWebhookSignature(payload, signature, verifierToken)) {
            throw new UnauthorizedException('Invalid webhook signature');
        }

        const data = JSON.parse(payload);

        for (const notification of data.eventNotifications || []) {
            for (const entity of notification.dataChangeEvent?.entities || []) {
                const { name, id, operation } = entity;

                this.logger.log(`Webhook: ${operation} ${name} ${id}`);

                try {
                    if (name === 'Invoice') {
                        await this.syncInvoiceById(id);
                    } else if (name === 'Payment') {
                        await this.handlePaymentWebhook(id);
                    } else if (name === 'Customer') {
                        await this.syncCustomerById(id);
                    }
                } catch (error) {
                    this.logger.error(`Webhook processing error for ${name} ${id}:`, error);
                }
            }
        }
    }

    /**
     * Sync a specific invoice by ID
     */
    private async syncInvoiceById(qbInvoiceId: string): Promise<void> {
        const { accessToken, realmId } = await this.getActiveConnection();
        const invoice = await this.qbClient.getInvoice(accessToken, realmId, qbInvoiceId);
        await this.syncSingleInvoice(invoice);
    }

    /**
     * Handle payment webhook - update order status
     */
    private async handlePaymentWebhook(qbPaymentId: string): Promise<void> {
        const { accessToken, realmId } = await this.getActiveConnection();

        // Get payment details
        const payments = await this.qbClient.queryPayments(accessToken, realmId, { maxResults: 1 });
        const payment = payments.find(p => p.Id === qbPaymentId);

        if (!payment) {
            this.logger.warn(`Payment ${qbPaymentId} not found`);
            return;
        }

        // Find order by customer QB ID
        const customer = await this.prisma.customer.findFirst({
            where: { qbCustomerId: payment.CustomerRef.value },
        });

        if (!customer) return;

        // Find pending orders for this customer and mark as completed
        const pendingOrders = await this.prisma.order.findMany({
            where: {
                customerId: customer.id,
                status: 'PENDING',
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
        });

        for (const order of pendingOrders) {
            await this.prisma.order.update({
                where: { id: order.id },
                data: {
                    status: 'COMPLETED',
                    qbPaymentId,
                },
            });

            // Award points now that order is completed
            await this.awardPointsForOrder(customer.id, Number(order.amount));
        }
    }

    /**
     * Sync a specific customer by ID
     */
    private async syncCustomerById(qbCustomerId: string): Promise<void> {
        const { accessToken, realmId } = await this.getActiveConnection();
        const customer = await this.qbClient.getCustomer(accessToken, realmId, qbCustomerId);
        await this.syncSingleCustomer(customer);
    }

    /**
     * Discount Helper: Look up customer and their available discounts
     */
    async lookupCustomerDiscounts(query: string): Promise<DiscountHelperResult | null> {
        // Search by phone, email, or name
        const customer = await this.prisma.customer.findFirst({
            where: {
                OR: [
                    { phone: { contains: query.replace(/\D/g, '') } },
                    { email: { contains: query, mode: 'insensitive' } },
                    { name: { contains: query, mode: 'insensitive' } },
                ],
            },
            include: {
                discountCodes: {
                    where: { isActive: true },
                },
            },
        });

        if (!customer) {
            return null;
        }

        // Get points redemption rate
        const pointsRule = await this.prisma.pointsRule.findFirst({
            where: {
                isActive: true,
                customerTypes: { has: customer.type },
            },
        });

        const redemptionRate = pointsRule ? Number(pointsRule.redemptionRate) : 0.01;
        const pointsValue = customer.points * redemptionRate;

        // Get discount rate based on customer type
        const discountRule = await this.prisma.discountRule.findFirst({
            where: {
                isActive: true,
                customerTypes: { has: customer.type },
            },
            orderBy: { value: 'desc' },
        });

        const memberDiscount = discountRule ? discountRule.value : customer.discountRate;

        // Build summary
        const summaryParts: string[] = [];
        if (memberDiscount > 0) {
            summaryParts.push(`${memberDiscount}% member discount`);
        }
        if (customer.customDiscountCode && customer.customDiscountRate) {
            summaryParts.push(`${customer.customDiscountRate}% with code ${customer.customDiscountCode}`);
        }
        if (customer.points > 0) {
            summaryParts.push(`${customer.points} points ($${pointsValue.toFixed(2)})`);
        }

        return {
            customer: {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email || undefined,
                type: customer.type,
                qbCustomerId: customer.qbCustomerId || undefined,
            },
            discounts: {
                memberDiscount,
                customDiscountCode: customer.customDiscountCode || undefined,
                customDiscountRate: customer.customDiscountRate || undefined,
                availablePoints: customer.points,
                pointsValue,
                promoCodes: customer.discountCodes.map(dc => ({
                    code: dc.code,
                    discountPercent: dc.discountPercent,
                    description: dc.description || undefined,
                    expiresAt: dc.expiresAt || undefined,
                })),
            },
            summary: summaryParts.join(' | ') || 'No discounts available',
        };
    }

    /**
     * Calculate final price with discounts
     */
    calculateDiscount(
        orderAmount: number,
        options: {
            applyMemberDiscount?: boolean;
            memberDiscountPercent?: number;
            applyPromoCode?: boolean;
            promoDiscountPercent?: number;
            redeemPoints?: number;
            pointsRedemptionRate?: number;
        }
    ): {
        originalAmount: number;
        memberDiscountAmount: number;
        promoDiscountAmount: number;
        pointsDiscountAmount: number;
        totalDiscount: number;
        finalAmount: number;
    } {
        let remainingAmount = orderAmount;
        let memberDiscountAmount = 0;
        let promoDiscountAmount = 0;
        let pointsDiscountAmount = 0;

        // Apply member discount first
        if (options.applyMemberDiscount && options.memberDiscountPercent) {
            memberDiscountAmount = remainingAmount * (options.memberDiscountPercent / 100);
            remainingAmount -= memberDiscountAmount;
        }

        // Apply promo code discount
        if (options.applyPromoCode && options.promoDiscountPercent) {
            promoDiscountAmount = remainingAmount * (options.promoDiscountPercent / 100);
            remainingAmount -= promoDiscountAmount;
        }

        // Apply points redemption
        if (options.redeemPoints && options.pointsRedemptionRate) {
            pointsDiscountAmount = Math.min(
                options.redeemPoints * options.pointsRedemptionRate,
                remainingAmount
            );
            remainingAmount -= pointsDiscountAmount;
        }

        const totalDiscount = memberDiscountAmount + promoDiscountAmount + pointsDiscountAmount;

        return {
            originalAmount: orderAmount,
            memberDiscountAmount: Math.round(memberDiscountAmount * 100) / 100,
            promoDiscountAmount: Math.round(promoDiscountAmount * 100) / 100,
            pointsDiscountAmount: Math.round(pointsDiscountAmount * 100) / 100,
            totalDiscount: Math.round(totalDiscount * 100) / 100,
            finalAmount: Math.round(remainingAmount * 100) / 100,
        };
    }

    /**
     * Log sync activity
     */
    private async logSync(
        entityType: string,
        entityId: string,
        action: string,
        status: string,
        count: number,
        errorMsg: string | null
    ): Promise<void> {
        await this.prisma.quickBooksSyncLog.create({
            data: {
                entityType,
                entityId,
                qbId: entityId,
                action,
                status,
                errorMsg,
                payload: { count },
            },
        });
    }

    /**
     * Get sync statistics
     */
    async getSyncStats(): Promise<{
        totalOrdersSynced: number;
        customersLinked: number;
        lastSyncTime: Date | null;
        syncSuccessRate: number;
        pendingErrors: number;
    }> {
        const [
            totalOrders,
            linkedCustomers,
            lastLog,
            successLogs,
            failedLogs,
        ] = await Promise.all([
            this.prisma.order.count({ where: { syncStatus: 'SYNCED' } }),
            this.prisma.customer.count({ where: { qbCustomerId: { not: null } } }),
            this.prisma.quickBooksSyncLog.findFirst({ orderBy: { createdAt: 'desc' } }),
            this.prisma.quickBooksSyncLog.count({ where: { status: 'SUCCESS' } }),
            this.prisma.quickBooksSyncLog.count({ where: { status: 'FAILED' } }),
        ]);

        const totalLogs = successLogs + failedLogs;
        const successRate = totalLogs > 0 ? (successLogs / totalLogs) * 100 : 100;

        return {
            totalOrdersSynced: totalOrders,
            customersLinked: linkedCustomers,
            lastSyncTime: lastLog?.createdAt || null,
            syncSuccessRate: Math.round(successRate * 10) / 10,
            pendingErrors: failedLogs,
        };
    }

    /**
     * Clean up expired OAuth states
     */
    private cleanupOAuthStates(): void {
        const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
        for (const [state, data] of this.oauthStates.entries()) {
            if (data.timestamp < fifteenMinutesAgo) {
                this.oauthStates.delete(state);
            }
        }
    }

    /**
     * Check if QuickBooks is configured
     */
    isConfigured(): boolean {
        return this.qbClient.isConfigured();
    }
}
