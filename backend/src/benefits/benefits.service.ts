import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { BatchAssignByTypeDto, BatchAssignByListsDto } from './dto';

export interface AssignedCustomer {
    customerId: string;
    customerName: string;
    customerType: string;
    assignedAt: string;
}

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

    // ==================== Get Single Discount Code ====================

    async getDiscountCodeById(id: string) {
        const code = await this.prisma.discountCode.findUnique({
            where: { id },
            include: {
                customer: { select: { id: true, name: true, type: true } },
                usageHistory: { orderBy: { usedAt: 'desc' } },
            },
        });

        if (!code) {
            throw new NotFoundException('Discount code not found');
        }

        // Get assigned customers from the code assignments table or metadata
        const assignments = await this.prisma.discountCodeAssignment.findMany({
            where: { discountCodeId: id },
            include: {
                customer: { select: { id: true, name: true, type: true } },
            },
            orderBy: { assignedAt: 'desc' },
        });

        return {
            id: code.id,
            code: code.code,
            type: code.type,
            description: code.description,
            discountPercent: code.discountPercent,
            isActive: code.isActive,
            usageCount: code.usageCount,
            uniqueUsersCount: code.uniqueUsersCount,
            assignedTo: code.customer ? {
                customerId: code.customer.id,
                customerName: code.customer.name,
                customerType: code.customer.type,
            } : undefined,
            assignedCustomers: assignments.map(a => ({
                id: a.id,
                customerId: a.customer.id,
                customerName: a.customer.name,
                customerType: a.customer.type,
                assignedAt: a.assignedAt.toISOString(),
            })),
            usageHistory: code.usageHistory.map(u => ({
                id: u.id,
                customerId: u.customerId,
                customerName: u.customerName,
                customerType: u.customerType,
                orderId: u.orderId,
                orderTotal: Number(u.orderTotal),
                discountAmount: Number(u.discountAmount),
                usedAt: u.usedAt.toISOString(),
            })),
            createdAt: code.createdAt.toISOString(),
            expiresAt: code.expiresAt?.toISOString(),
        };
    }

    // ==================== Batch Assign Promo Code ====================

    async batchAssignByType(codeId: string, dto: BatchAssignByTypeDto) {
        const code = await this.prisma.discountCode.findUnique({
            where: { id: codeId },
        });

        if (!code) {
            throw new NotFoundException('Discount code not found');
        }

        // Get all customers of the specified types
        const customers = await this.prisma.customer.findMany({
            where: {
                type: { in: dto.customerTypes as any[] },
            },
            select: { id: true, name: true, type: true },
        });

        this.logger.log(`Found ${customers.length} customers for types: ${dto.customerTypes.join(', ')}`);

        // Create assignments for each customer (skip if already exists)
        let created = 0;
        let skipped = 0;

        for (const customer of customers) {
            try {
                await this.prisma.discountCodeAssignment.create({
                    data: {
                        discountCodeId: codeId,
                        customerId: customer.id,
                    },
                });
                created++;
            } catch (error) {
                // Skip if already assigned (unique constraint violation)
                skipped++;
            }
        }

        this.logger.log(`Batch assign complete: ${created} created, ${skipped} skipped`);

        return {
            success: true,
            message: `Assigned to ${created} customers (${skipped} already assigned)`,
            assigned: created,
            skipped,
            total: customers.length,
        };
    }

    async batchAssignByLists(codeId: string, dto: BatchAssignByListsDto) {
        const code = await this.prisma.discountCode.findUnique({
            where: { id: codeId },
        });

        if (!code) {
            throw new NotFoundException('Discount code not found');
        }

        // Get all contacts from the specified lists that have a linked customer
        const contacts = await this.prisma.contact.findMany({
            where: {
                listId: { in: dto.listIds },
                customerId: { not: null },
            },
            select: { customerId: true, name: true, customerType: true },
            distinct: ['customerId'],
        });

        this.logger.log(`Found ${contacts.length} contacts with linked customers from ${dto.listIds.length} lists`);

        // Create assignments for each customer (skip if already exists)
        let created = 0;
        let skipped = 0;

        for (const contact of contacts) {
            if (!contact.customerId) continue;

            try {
                await this.prisma.discountCodeAssignment.create({
                    data: {
                        discountCodeId: codeId,
                        customerId: contact.customerId,
                    },
                });
                created++;
            } catch (error) {
                // Skip if already assigned (unique constraint violation)
                skipped++;
            }
        }

        this.logger.log(`Batch assign by lists complete: ${created} created, ${skipped} skipped`);

        return {
            success: true,
            message: `Assigned to ${created} customers (${skipped} already assigned)`,
            assigned: created,
            skipped,
            total: contacts.length,
        };
    }

    async removeAssignment(codeId: string, assignmentId: string) {
        const assignment = await this.prisma.discountCodeAssignment.findFirst({
            where: {
                id: assignmentId,
                discountCodeId: codeId,
            },
        });

        if (!assignment) {
            throw new NotFoundException('Assignment not found');
        }

        await this.prisma.discountCodeAssignment.delete({
            where: { id: assignmentId },
        });

        return { success: true, message: 'Assignment removed' };
    }

    async clearAllAssignments(codeId: string) {
        const code = await this.prisma.discountCode.findUnique({
            where: { id: codeId },
        });

        if (!code) {
            throw new NotFoundException('Discount code not found');
        }

        const result = await this.prisma.discountCodeAssignment.deleteMany({
            where: { discountCodeId: codeId },
        });

        return {
            success: true,
            message: `Removed ${result.count} assignments`,
            removed: result.count,
        };
    }
}
