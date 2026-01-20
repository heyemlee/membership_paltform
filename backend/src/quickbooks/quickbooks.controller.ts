import {
    Controller,
    Get,
    Post,
    Query,
    Body,
    Headers,
    Res,
    UseGuards,
    HttpCode,
    HttpStatus,
    BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QuickBooksService } from './quickbooks.service';
import { PrismaService } from '../database/prisma.service';

@Controller('quickbooks')
export class QuickBooksController {
    constructor(
        private readonly quickBooksService: QuickBooksService,
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) { }

    /**
     * Get OAuth authorization URL
     */
    @Get('auth-url')
    @UseGuards(JwtAuthGuard)
    getAuthUrl() {
        if (!this.quickBooksService.isConfigured()) {
            throw new BadRequestException('QuickBooks is not configured. Please set QUICKBOOKS_CLIENT_ID and QUICKBOOKS_CLIENT_SECRET.');
        }

        return this.quickBooksService.getAuthUrl();
    }

    /**
     * OAuth callback handler
     */
    @Get('callback')
    async handleCallback(
        @Query('code') code: string,
        @Query('realmId') realmId: string,
        @Query('state') state: string,
        @Res() res: Response,
    ) {
        if (!code || !realmId || !state) {
            const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
            return res.redirect(`${frontendUrl}/integrations/quickbooks?error=missing_params`);
        }

        try {
            await this.quickBooksService.handleCallback(code, realmId, state);
            const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
            return res.redirect(`${frontendUrl}/integrations/quickbooks?success=true`);
        } catch (error) {
            const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.redirect(`${frontendUrl}/integrations/quickbooks?error=${encodeURIComponent(errorMessage)}`);
        }
    }

    /**
     * Get connection status
     */
    @Get('status')
    @UseGuards(JwtAuthGuard)
    async getStatus() {
        const status = await this.quickBooksService.getConnectionStatus();
        const stats = status.isConnected ? await this.quickBooksService.getSyncStats() : null;

        return {
            ...status,
            isConfigured: this.quickBooksService.isConfigured(),
            stats,
        };
    }

    /**
     * Disconnect from QuickBooks
     */
    @Post('disconnect')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async disconnect() {
        await this.quickBooksService.disconnect();
        return { message: 'Disconnected from QuickBooks' };
    }

    /**
     * Manually refresh token
     */
    @Post('refresh-token')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async refreshToken() {
        await this.quickBooksService.refreshTokenIfNeeded();
        return { message: 'Token refreshed successfully' };
    }

    /**
     * Sync customers from QuickBooks
     */
    @Post('sync/customers')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async syncCustomers() {
        return this.quickBooksService.syncCustomers();
    }

    /**
     * Sync orders from QuickBooks
     */
    @Post('sync/orders')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async syncOrders(@Body() body: { modifiedAfter?: string }) {
        return this.quickBooksService.syncOrders(body.modifiedAfter);
    }

    /**
     * Webhook receiver for QuickBooks events
     */
    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    async handleWebhook(
        @Body() payload: any,
        @Headers('intuit-signature') signature: string,
    ) {
        // QuickBooks sends a verification request during setup
        if (payload.eventNotifications === undefined) {
            return { message: 'Webhook endpoint verified' };
        }

        await this.quickBooksService.handleWebhook(JSON.stringify(payload), signature);
        return { message: 'Webhook processed' };
    }

    /**
     * Discount Helper: Look up customer discounts
     */
    @Get('discount-helper/lookup')
    @UseGuards(JwtAuthGuard)
    async lookupCustomerDiscounts(@Query('q') query: string) {
        if (!query || query.length < 2) {
            throw new BadRequestException('Query must be at least 2 characters');
        }

        const result = await this.quickBooksService.lookupCustomerDiscounts(query);

        if (!result) {
            return { found: false, message: 'Customer not found' };
        }

        return { found: true, ...result };
    }

    /**
     * Discount Helper: Calculate discount
     */
    @Post('discount-helper/calculate')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    calculateDiscount(
        @Body() body: {
            orderAmount: number;
            applyMemberDiscount?: boolean;
            memberDiscountPercent?: number;
            applyPromoCode?: boolean;
            promoDiscountPercent?: number;
            redeemPoints?: number;
            pointsRedemptionRate?: number;
        }
    ) {
        if (!body.orderAmount || body.orderAmount <= 0) {
            throw new BadRequestException('Order amount must be greater than 0');
        }

        return this.quickBooksService.calculateDiscount(body.orderAmount, {
            applyMemberDiscount: body.applyMemberDiscount,
            memberDiscountPercent: body.memberDiscountPercent,
            applyPromoCode: body.applyPromoCode,
            promoDiscountPercent: body.promoDiscountPercent,
            redeemPoints: body.redeemPoints,
            pointsRedemptionRate: body.pointsRedemptionRate,
        });
    }

    /**
     * Get sync statistics
     */
    @Get('sync-stats')
    @UseGuards(JwtAuthGuard)
    async getSyncStats() {
        return this.quickBooksService.getSyncStats();
    }

    /**
     * Get recent sync logs
     */
    @Get('sync-logs')
    @UseGuards(JwtAuthGuard)
    async getSyncLogs(
        @Query('limit') limit: number = 20,
        @Query('status') status?: string,
    ) {
        const logs = await this.prisma.quickBooksSyncLog.findMany({
            where: status ? { status } : undefined,
            orderBy: { createdAt: 'desc' },
            take: Math.min(limit, 100),
        });

        return { logs };
    }
}
