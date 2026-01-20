import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

    constructor(private prisma: PrismaService) { }

    async findAll(query: { page?: number; limit?: number; status?: string; customerId?: string }) {
        const { page = 1, limit = 10, status, customerId } = query;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.status = status;
        if (customerId) where.customerId = customerId;

        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { items: true },
            }),
            this.prisma.order.count({ where }),
        ]);

        return {
            data: orders.map(o => ({
                id: o.id,
                qbId: o.qbId,
                qbInvoiceId: o.qbInvoiceId,
                customerName: o.customerName,
                customerId: o.customerId,
                total: Number(o.total),
                amount: Number(o.amount),
                status: o.status,
                syncStatus: o.syncStatus,
                createdAt: o.createdAt.toISOString(),
                discountCode: o.discountCode,
                codeOwnerId: o.codeOwnerId,
                codeOwnerName: o.codeOwnerName,
                items: o.items.map(i => ({
                    id: i.id,
                    name: i.name,
                    quantity: i.quantity,
                    unitPrice: Number(i.unitPrice),
                    total: Number(i.total),
                })),
            })),
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async findOne(id: string) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: { items: true, customer: true },
        });

        if (!order) return null;

        return {
            id: order.id,
            qbId: order.qbId,
            qbInvoiceId: order.qbInvoiceId,
            customerName: order.customerName,
            customerId: order.customerId,
            customer: order.customer,
            total: Number(order.total),
            amount: Number(order.amount),
            status: order.status,
            syncStatus: order.syncStatus,
            createdAt: order.createdAt.toISOString(),
            discountCode: order.discountCode,
            items: order.items,
        };
    }

    async create(data: {
        customerId: string;
        customerName: string;
        items: { name: string; quantity: number; unitPrice: number }[];
        discountCode?: string;
        pointsToRedeem?: number;
    }) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: data.customerId },
        });

        if (!customer) {
            throw new Error('Customer not found');
        }

        // Calculate totals
        const subtotal = data.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
        const discountRate = customer.discountRate || 0;
        const discountAmount = subtotal * (discountRate / 100);
        const pointsValue = data.pointsToRedeem ? Math.min(data.pointsToRedeem, customer.points) * 0.01 : 0;
        const total = Math.max(0, subtotal - discountAmount - pointsValue);

        // Create order with items in transaction
        const result = await this.prisma.$transaction(async (tx) => {
            // Create the order
            const order = await tx.order.create({
                data: {
                    customerId: data.customerId,
                    customerName: data.customerName,
                    qbInvoiceId: `INV-${Date.now()}`,
                    total: total,
                    amount: subtotal,
                    status: 'PENDING',
                    syncStatus: 'LOCAL',
                    discountCode: data.discountCode,
                    items: {
                        create: data.items.map(item => ({
                            name: item.name,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            total: item.unitPrice * item.quantity,
                        })),
                    },
                },
                include: { items: true },
            });

            // Deduct points if used
            if (data.pointsToRedeem && data.pointsToRedeem > 0) {
                const pointsUsed = Math.min(data.pointsToRedeem, customer.points);
                await tx.customer.update({
                    where: { id: data.customerId },
                    data: { points: { decrement: pointsUsed } },
                });

                await tx.pointsTransaction.create({
                    data: {
                        customerId: data.customerId,
                        amount: -pointsUsed,
                        type: 'REDEEM',
                        description: `Redeemed for order ${order.qbInvoiceId}`,
                    },
                });
            }

            return order;
        });

        return {
            id: result.id,
            qbInvoiceId: result.qbInvoiceId,
            customerName: result.customerName,
            total: Number(result.total),
            status: result.status,
            createdAt: result.createdAt.toISOString(),
        };
    }

    async updateStatus(id: string, status: OrderStatus) {
        const order = await this.prisma.order.update({
            where: { id },
            data: { status },
        });

        // If order is completed, award points to customer
        if (status === 'COMPLETED') {
            const pointsToAward = Math.floor(Number(order.total));
            await this.prisma.customer.update({
                where: { id: order.customerId },
                data: { points: { increment: pointsToAward } },
            });

            await this.prisma.pointsTransaction.create({
                data: {
                    customerId: order.customerId,
                    amount: pointsToAward,
                    type: 'EARN',
                    description: `Order ${order.qbInvoiceId || order.id}`,
                },
            });
        }

        return order;
    }

    // Placeholder for QuickBooks sync
    async syncFromQuickBooks() {
        this.logger.log('QuickBooks sync triggered - implement OAuth flow first');
        return { message: 'QuickBooks sync not yet configured' };
    }
}
