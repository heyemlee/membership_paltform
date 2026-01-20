import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getStats() {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        // Current period stats
        const [
            currentOrders,
            previousOrders,
            totalCustomers,
            pendingOrders,
            recentOrders,
            topCustomers,
        ] = await Promise.all([
            // Current 30 days orders
            this.prisma.order.aggregate({
                where: {
                    createdAt: { gte: thirtyDaysAgo },
                    status: 'COMPLETED',
                },
                _sum: { total: true },
                _count: true,
            }),
            // Previous 30 days orders
            this.prisma.order.aggregate({
                where: {
                    createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
                    status: 'COMPLETED',
                },
                _sum: { total: true },
                _count: true,
            }),
            // Total customers count (all customers)
            this.prisma.customer.count(),
            // Pending orders
            this.prisma.order.count({
                where: { status: 'PENDING' },
            }),
            // Recent orders
            this.prisma.order.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { items: true },
            }),
            // Top customers by spending
            this.prisma.order.groupBy({
                by: ['customerId', 'customerName'],
                where: { status: 'COMPLETED' },
                _sum: { total: true },
                _count: true,
                orderBy: { _sum: { total: 'desc' } },
                take: 5,
            }),
        ]);

        const totalRevenue = Number(currentOrders._sum.total) || 0;
        const previousRevenue = Number(previousOrders._sum.total) || 0;
        const revenueChange = previousRevenue > 0
            ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
            : 0;

        const totalOrdersCount = currentOrders._count || 0;
        const previousOrdersCount = previousOrders._count || 0;
        const ordersChange = previousOrdersCount > 0
            ? ((totalOrdersCount - previousOrdersCount) / previousOrdersCount) * 100
            : 0;

        return {
            totalRevenue,
            revenueChange: Math.round(revenueChange * 10) / 10,
            activeCustomers: totalCustomers,
            customersChange: 0,
            totalOrders: totalOrdersCount,
            ordersChange: Math.round(ordersChange * 10) / 10,
            pendingOrders,
            pendingChange: 0,
            recentOrders: recentOrders.map(o => ({
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
                items: o.items.map(i => ({
                    id: i.id,
                    name: i.name,
                    quantity: i.quantity,
                    unitPrice: Number(i.unitPrice),
                    total: Number(i.total),
                })),
            })),
            topCustomers: topCustomers.map(tc => ({
                id: tc.customerId,
                name: tc.customerName,
                totalSpent: Number(tc._sum.total) || 0,
                orderCount: tc._count,
            })),
        };
    }
}
