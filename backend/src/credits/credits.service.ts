import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { IssueCreditDto, IssueByTypeDto, IssueByListsDto, IssueByCustomersDto, UseCreditDto } from './dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CreditsService {
    private readonly logger = new Logger(CreditsService.name);

    constructor(private prisma: PrismaService) { }

    // ==================== 获取代金券列表 ====================

    async getAllCredits(query: { status?: string; source?: string }) {
        const where: any = {};

        if (query.status === 'available') {
            where.isUsed = false;
            where.isActive = true;
            where.OR = [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
            ];
        } else if (query.status === 'used') {
            where.isUsed = true;
        } else if (query.status === 'expired') {
            where.isUsed = false;
            where.expiresAt = { lt: new Date() };
        }

        if (query.source) {
            where.source = query.source;
        }

        const credits = await this.prisma.customerCredit.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                customer: { select: { id: true, name: true, type: true } },
            },
        });

        return credits.map(c => ({
            id: c.id,
            customerId: c.customerId,
            customerName: c.customer.name,
            customerType: c.customer.type,
            amount: Number(c.amount),
            minOrderAmount: Number(c.minOrderAmount),
            name: c.name,
            description: c.description,
            source: c.source,
            batchId: c.batchId,
            isUsed: c.isUsed,
            isActive: c.isActive,
            expiresAt: c.expiresAt?.toISOString(),
            createdAt: c.createdAt.toISOString(),
            usedAt: c.usedAt?.toISOString(),
        }));
    }

    // ==================== 获取客户的代金券 ====================

    async getCustomerCredits(customerId: string, onlyAvailable = false) {
        const where: any = { customerId };

        if (onlyAvailable) {
            where.isUsed = false;
            where.isActive = true;
            where.OR = [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
            ];
        }

        const credits = await this.prisma.customerCredit.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        return credits.map(c => ({
            id: c.id,
            amount: Number(c.amount),
            minOrderAmount: Number(c.minOrderAmount),
            name: c.name,
            description: c.description,
            source: c.source,
            isUsed: c.isUsed,
            isActive: c.isActive,
            expiresAt: c.expiresAt?.toISOString(),
            createdAt: c.createdAt.toISOString(),
            usedAt: c.usedAt?.toISOString(),
        }));
    }

    // ==================== 获取批次统计 ====================

    async getCreditBatches() {
        const batches = await this.prisma.customerCredit.groupBy({
            by: ['batchId', 'name', 'source', 'amount', 'minOrderAmount'],
            _count: { id: true },
            _sum: { amount: true },
            where: { batchId: { not: null } },
            orderBy: { batchId: 'desc' },
        });

        // 获取每个批次的使用情况
        const batchStats = await Promise.all(
            batches.map(async (batch) => {
                const usedCount = await this.prisma.customerCredit.count({
                    where: { batchId: batch.batchId, isUsed: true },
                });

                const firstCredit = await this.prisma.customerCredit.findFirst({
                    where: { batchId: batch.batchId },
                    select: { createdAt: true, expiresAt: true },
                });

                return {
                    batchId: batch.batchId,
                    name: batch.name,
                    source: batch.source,
                    amount: Number(batch.amount),
                    minOrderAmount: Number(batch.minOrderAmount),
                    totalIssued: batch._count.id,
                    usedCount,
                    totalValue: Number(batch._sum.amount),
                    createdAt: firstCredit?.createdAt.toISOString(),
                    expiresAt: firstCredit?.expiresAt?.toISOString(),
                };
            })
        );

        return batchStats;
    }

    // ==================== 发放代金券 - 按客户类型 ====================

    async issueByType(dto: IssueByTypeDto) {
        const batchId = uuidv4();
        const expiresAt = dto.expiresInDays
            ? new Date(Date.now() + dto.expiresInDays * 24 * 60 * 60 * 1000)
            : null;

        // 获取指定类型的所有客户
        const customers = await this.prisma.customer.findMany({
            where: { type: { in: dto.customerTypes as any[] } },
            select: { id: true, name: true, type: true },
        });

        this.logger.log(`Found ${customers.length} customers for types: ${dto.customerTypes.join(', ')}`);

        // 批量创建代金券
        const credits = await this.prisma.customerCredit.createMany({
            data: customers.map(customer => ({
                customerId: customer.id,
                amount: dto.amount,
                minOrderAmount: dto.minOrderAmount,
                name: dto.name,
                description: dto.description,
                source: dto.source || 'MANUAL',
                batchId,
                expiresAt,
            })),
        });

        this.logger.log(`Batch issue complete: ${credits.count} credits created with batchId: ${batchId}`);

        return {
            success: true,
            message: `Successfully issued ${credits.count} credits to customers`,
            batchId,
            issued: credits.count,
            amount: dto.amount,
            minOrderAmount: dto.minOrderAmount,
            expiresAt: expiresAt?.toISOString(),
        };
    }

    // ==================== 发放代金券 - 按联系人列表 ====================

    async issueByLists(dto: IssueByListsDto) {
        const batchId = uuidv4();
        const expiresAt = dto.expiresInDays
            ? new Date(Date.now() + dto.expiresInDays * 24 * 60 * 60 * 1000)
            : null;

        // 获取联系人列表中有关联客户的联系人
        const contacts = await this.prisma.contact.findMany({
            where: {
                listId: { in: dto.listIds },
                customerId: { not: null },
            },
            select: { customerId: true },
            distinct: ['customerId'],
        });

        const customerIds = contacts
            .map(c => c.customerId)
            .filter((id): id is string => id !== null);

        this.logger.log(`Found ${customerIds.length} customers from ${dto.listIds.length} lists`);

        if (customerIds.length === 0) {
            return {
                success: true,
                message: 'No customers found in the selected lists',
                batchId,
                issued: 0,
            };
        }

        // 批量创建代金券
        const credits = await this.prisma.customerCredit.createMany({
            data: customerIds.map(customerId => ({
                customerId,
                amount: dto.amount,
                minOrderAmount: dto.minOrderAmount,
                name: dto.name,
                description: dto.description,
                source: dto.source || 'MANUAL',
                batchId,
                expiresAt,
            })),
        });

        this.logger.log(`Batch issue by lists complete: ${credits.count} credits created`);

        return {
            success: true,
            message: `Successfully issued ${credits.count} credits to customers`,
            batchId,
            issued: credits.count,
            amount: dto.amount,
            minOrderAmount: dto.minOrderAmount,
            expiresAt: expiresAt?.toISOString(),
        };
    }

    // ==================== 发放代金券 - 按客户ID ====================

    async issueByCustomers(dto: IssueByCustomersDto) {
        const batchId = uuidv4();
        const expiresAt = dto.expiresInDays
            ? new Date(Date.now() + dto.expiresInDays * 24 * 60 * 60 * 1000)
            : null;

        // 验证客户存在
        const existingCustomers = await this.prisma.customer.findMany({
            where: { id: { in: dto.customerIds } },
            select: { id: true },
        });

        const validCustomerIds = existingCustomers.map(c => c.id);

        this.logger.log(`Found ${validCustomerIds.length} valid customers out of ${dto.customerIds.length}`);

        if (validCustomerIds.length === 0) {
            return {
                success: false,
                message: 'No valid customers found',
                batchId,
                issued: 0,
            };
        }

        // 批量创建代金券
        const credits = await this.prisma.customerCredit.createMany({
            data: validCustomerIds.map(customerId => ({
                customerId,
                amount: dto.amount,
                minOrderAmount: dto.minOrderAmount,
                name: dto.name,
                description: dto.description,
                source: dto.source || 'MANUAL',
                batchId,
                expiresAt,
            })),
        });

        this.logger.log(`Batch issue by customers complete: ${credits.count} credits created`);

        return {
            success: true,
            message: `Successfully issued ${credits.count} credits to selected customers`,
            batchId,
            issued: credits.count,
            amount: dto.amount,
            minOrderAmount: dto.minOrderAmount,
            expiresAt: expiresAt?.toISOString(),
        };
    }

    // ==================== 使用代金券 ====================

    async useCredit(creditId: string, dto: UseCreditDto) {
        const credit = await this.prisma.customerCredit.findUnique({
            where: { id: creditId },
        });

        if (!credit) {
            throw new NotFoundException('Credit not found');
        }

        if (credit.isUsed) {
            throw new BadRequestException('Credit has already been used');
        }

        if (!credit.isActive) {
            throw new BadRequestException('Credit is not active');
        }

        if (credit.expiresAt && new Date(credit.expiresAt) < new Date()) {
            throw new BadRequestException('Credit has expired');
        }

        if (dto.orderTotal < Number(credit.minOrderAmount)) {
            throw new BadRequestException(
                `Order total ($${dto.orderTotal}) does not meet minimum requirement ($${credit.minOrderAmount})`
            );
        }

        // 使用代金券
        await this.prisma.$transaction([
            this.prisma.customerCredit.update({
                where: { id: creditId },
                data: { isUsed: true, usedAt: new Date() },
            }),
            this.prisma.creditUsage.create({
                data: {
                    creditId,
                    orderId: dto.orderId,
                    orderTotal: dto.orderTotal,
                    amountUsed: credit.amount,
                },
            }),
        ]);

        return {
            success: true,
            message: 'Credit applied successfully',
            amountUsed: Number(credit.amount),
        };
    }

    // ==================== 验证代金券是否可用 ====================

    async validateCredit(creditId: string, orderTotal: number) {
        const credit = await this.prisma.customerCredit.findUnique({
            where: { id: creditId },
        });

        if (!credit) {
            return { valid: false, message: 'Credit not found' };
        }

        if (credit.isUsed) {
            return { valid: false, message: 'Credit has already been used' };
        }

        if (!credit.isActive) {
            return { valid: false, message: 'Credit is not active' };
        }

        if (credit.expiresAt && new Date(credit.expiresAt) < new Date()) {
            return { valid: false, message: 'Credit has expired' };
        }

        if (orderTotal < Number(credit.minOrderAmount)) {
            return {
                valid: false,
                message: `Minimum order amount is $${credit.minOrderAmount}`,
                minOrderAmount: Number(credit.minOrderAmount),
            };
        }

        return {
            valid: true,
            amount: Number(credit.amount),
            name: credit.name,
        };
    }

    // ==================== 撤销代金券 ====================

    async revokeCredit(creditId: string) {
        const credit = await this.prisma.customerCredit.findUnique({
            where: { id: creditId },
        });

        if (!credit) {
            throw new NotFoundException('Credit not found');
        }

        if (credit.isUsed) {
            throw new BadRequestException('Cannot revoke a used credit');
        }

        await this.prisma.customerCredit.update({
            where: { id: creditId },
            data: { isActive: false },
        });

        return { success: true, message: 'Credit revoked successfully' };
    }

    // ==================== 批量撤销代金券 ====================

    async revokeBatch(batchId: string) {
        const result = await this.prisma.customerCredit.updateMany({
            where: { batchId, isUsed: false },
            data: { isActive: false },
        });

        return {
            success: true,
            message: `Revoked ${result.count} credits`,
            revoked: result.count,
        };
    }

    // ==================== 统计概览 ====================

    async getStats() {
        const now = new Date();

        const [totalIssued, totalUsed, totalActive, totalExpired, totalValue] = await Promise.all([
            this.prisma.customerCredit.count(),
            this.prisma.customerCredit.count({ where: { isUsed: true } }),
            this.prisma.customerCredit.count({
                where: {
                    isUsed: false,
                    isActive: true,
                    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
                },
            }),
            this.prisma.customerCredit.count({
                where: {
                    isUsed: false,
                    expiresAt: { lt: now },
                },
            }),
            this.prisma.customerCredit.aggregate({
                _sum: { amount: true },
            }),
        ]);

        const usedValue = await this.prisma.customerCredit.aggregate({
            _sum: { amount: true },
            where: { isUsed: true },
        });

        return {
            totalIssued,
            totalUsed,
            totalActive,
            totalExpired,
            totalValue: Number(totalValue._sum.amount) || 0,
            usedValue: Number(usedValue._sum.amount) || 0,
            usageRate: totalIssued > 0 ? Math.round((totalUsed / totalIssued) * 100) : 0,
        };
    }
}
