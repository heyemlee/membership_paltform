import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class BenefitsService {
    private readonly logger = new Logger(BenefitsService.name);

    constructor(private prisma: PrismaService) { }

    // ==================== Discount Rules ====================

    async getDiscountRules() {
        const rules = await this.prisma.discountRule.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return rules.map(r => ({
            id: r.id,
            name: r.name,
            description: r.description,
            type: r.type,
            value: r.value,
            customerTypes: r.customerTypes,
            minOrderAmount: r.minOrderAmount ? Number(r.minOrderAmount) : undefined,
            maxDiscount: r.maxDiscount ? Number(r.maxDiscount) : undefined,
            isActive: r.isActive,
            validFrom: r.validFrom?.toISOString(),
            validUntil: r.validUntil?.toISOString(),
            usageLimit: r.usageLimit,
            usageCount: r.usageCount,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
        }));
    }

    async createDiscountRule(data: any) {
        return this.prisma.discountRule.create({ data });
    }

    async updateDiscountRule(id: string, data: any) {
        return this.prisma.discountRule.update({ where: { id }, data });
    }

    async deleteDiscountRule(id: string) {
        return this.prisma.discountRule.delete({ where: { id } });
    }

    // ==================== Points Rules ====================

    async getPointsRules() {
        const rules = await this.prisma.pointsRule.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return rules.map(r => ({
            id: r.id,
            name: r.name,
            description: r.description,
            earnRate: r.earnRate,
            redemptionRate: Number(r.redemptionRate),
            customerTypes: r.customerTypes,
            minPointsToRedeem: r.minPointsToRedeem,
            maxPointsPerOrder: r.maxPointsPerOrder,
            isActive: r.isActive,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
        }));
    }

    async createPointsRule(data: any) {
        return this.prisma.pointsRule.create({ data });
    }

    async updatePointsRule(id: string, data: any) {
        return this.prisma.pointsRule.update({ where: { id }, data });
    }

    async deletePointsRule(id: string) {
        return this.prisma.pointsRule.delete({ where: { id } });
    }

    // ==================== Discount Codes ====================

    async getDiscountCodes(query: { type?: string }) {
        const where: any = {};
        if (query.type === 'GENERIC') where.type = 'GENERIC';
        if (query.type === 'EXCLUSIVE') where.type = 'EXCLUSIVE';

        const codes = await this.prisma.discountCode.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                customer: { select: { id: true, name: true, type: true } },
                usageHistory: { take: 10, orderBy: { usedAt: 'desc' } },
            },
        });

        return codes.map(c => ({
            id: c.id,
            code: c.code,
            type: c.type,
            description: c.description,
            discountPercent: c.discountPercent,
            isActive: c.isActive,
            usageCount: c.usageCount,
            uniqueUsersCount: c.uniqueUsersCount,
            assignedTo: c.customer ? {
                customerId: c.customer.id,
                customerName: c.customer.name,
                customerType: c.customer.type,
            } : undefined,
            usageHistory: c.usageHistory.map(u => ({
                id: u.id,
                customerId: u.customerId,
                customerName: u.customerName,
                customerType: u.customerType,
                orderId: u.orderId,
                orderTotal: Number(u.orderTotal),
                discountAmount: Number(u.discountAmount),
                usedAt: u.usedAt.toISOString(),
            })),
            createdAt: c.createdAt.toISOString(),
            expiresAt: c.expiresAt?.toISOString(),
        }));
    }

    async createDiscountCode(data: any) {
        return this.prisma.discountCode.create({ data });
    }

    async updateDiscountCode(id: string, data: any) {
        return this.prisma.discountCode.update({ where: { id }, data });
    }

    async deleteDiscountCode(id: string) {
        return this.prisma.discountCode.delete({ where: { id } });
    }

    async validateDiscountCode(code: string) {
        const discountCode = await this.prisma.discountCode.findUnique({
            where: { code },
            include: { customer: true },
        });

        if (!discountCode) {
            return { valid: false, message: 'Code not found' };
        }

        if (!discountCode.isActive) {
            return { valid: false, message: 'Code is inactive' };
        }

        if (discountCode.expiresAt && new Date(discountCode.expiresAt) < new Date()) {
            return { valid: false, message: 'Code has expired' };
        }

        return {
            valid: true,
            discountPercent: discountCode.discountPercent,
            type: discountCode.type,
            assignedTo: discountCode.customer ? discountCode.customer.name : null,
        };
    }
}
