import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCustomerDto, UpdateCustomerDto, CustomerQueryDto } from './dto';
import { Prisma, CustomerType } from '@prisma/client';

@Injectable()
export class CustomersService {
    private readonly logger = new Logger(CustomersService.name);

    constructor(
        private prisma: PrismaService,
        private supabase: SupabaseService,
    ) { }

    // Helper method to get discount rate for customer type from settings
    private async getDiscountRatesFromSettings(): Promise<Record<string, number>> {
        const setting = await this.prisma.systemSetting.findUnique({
            where: { key: 'discount_rates' },
        });

        if (setting && setting.value) {
            const rates = setting.value as Record<string, number>;
            return {
                GC: rates.GC || 0,
                DESIGNER: rates.DESIGNER || 0,
                WHOLESALE: rates.WHOLESALE || 0,
                REGULAR: 0,
            };
        }

        // Default rates if not configured
        return { GC: 25, DESIGNER: 25, WHOLESALE: 25, REGULAR: 0 };
    }

    private getDiscountRateForType(type: string, rates: Record<string, number>): number {
        return rates[type] || 0;
    }

    async findAll(query: CustomerQueryDto) {
        const { page = 1, limit = 10, type, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.CustomerWhereInput = {};

        if (type) {
            where.type = type as CustomerType;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Get discount rates from settings
        const discountRates = await this.getDiscountRatesFromSettings();

        const [customers, total] = await Promise.all([
            this.prisma.customer.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    _count: {
                        select: { orders: true },
                    },
                },
            }),
            this.prisma.customer.count({ where }),
        ]);

        return {
            data: customers.map(c => ({
                id: c.id,
                name: c.name,
                email: c.email,
                phone: c.phone,
                type: c.type,
                points: c.points,
                // Use discount rate from settings based on customer type
                discountRate: this.getDiscountRateForType(c.type, discountRates),
                customDiscountCode: c.customDiscountCode,
                customDiscountRate: c.customDiscountRate,
                createdAt: c.createdAt.toISOString(),
                updatedAt: c.updatedAt.toISOString(),
                orderCount: c._count.orders,
            })),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string) {
        const customer = await this.prisma.customer.findUnique({
            where: { id },
            include: {
                orders: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    include: { items: true },
                },
                pointsTransactions: {
                    take: 20,
                    orderBy: { createdAt: 'desc' },
                },
                discountCodes: true,
            },
        });

        if (!customer) {
            throw new NotFoundException('Customer not found');
        }

        // Get discount rates from settings
        const discountRates = await this.getDiscountRatesFromSettings();

        return {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            type: customer.type,
            points: customer.points,
            // Use discount rate from settings based on customer type
            discountRate: this.getDiscountRateForType(customer.type, discountRates),
            customDiscountCode: customer.customDiscountCode,
            customDiscountRate: customer.customDiscountRate,
            notes: customer.notes,
            createdAt: customer.createdAt.toISOString(),
            updatedAt: customer.updatedAt.toISOString(),
            orders: customer.orders.map(o => ({
                id: o.id,
                customerId: o.customerId,
                total: Number(o.total),
                status: o.status,
                createdAt: o.createdAt.toISOString(),
                items: o.items.map(item => ({
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: Number(item.unitPrice),
                })),
            })),
            pointsHistory: customer.pointsTransactions.map(pt => ({
                id: pt.id,
                customerId: pt.customerId,
                amount: pt.amount,
                type: pt.type,
                description: pt.description,
                createdAt: pt.createdAt.toISOString(),
            })),
        };
    }

    async create(createDto: CreateCustomerDto) {
        const customer = await this.prisma.customer.create({
            data: {
                name: createDto.name,
                email: createDto.email,
                phone: createDto.phone,
                type: createDto.type as CustomerType || 'REGULAR',
                discountRate: createDto.discountRate || 0,
                customDiscountCode: createDto.customDiscountCode,
                customDiscountRate: createDto.customDiscountRate,
                notes: createDto.notes,
            },
        });

        return {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            type: customer.type,
            points: customer.points,
            discountRate: customer.discountRate,
            createdAt: customer.createdAt.toISOString(),
            updatedAt: customer.updatedAt.toISOString(),
        };
    }

    async update(id: string, updateDto: UpdateCustomerDto) {
        const customer = await this.prisma.customer.update({
            where: { id },
            data: {
                ...(updateDto.name && { name: updateDto.name }),
                ...(updateDto.email !== undefined && { email: updateDto.email }),
                ...(updateDto.phone && { phone: updateDto.phone }),
                ...(updateDto.type && { type: updateDto.type as CustomerType }),
                ...(updateDto.discountRate !== undefined && { discountRate: updateDto.discountRate }),
                ...(updateDto.customDiscountCode !== undefined && { customDiscountCode: updateDto.customDiscountCode }),
                ...(updateDto.customDiscountRate !== undefined && { customDiscountRate: updateDto.customDiscountRate }),
                ...(updateDto.notes !== undefined && { notes: updateDto.notes }),
            },
        });

        return {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            type: customer.type,
            points: customer.points,
            discountRate: customer.discountRate,
            createdAt: customer.createdAt.toISOString(),
            updatedAt: customer.updatedAt.toISOString(),
        };
    }

    async remove(id: string) {
        const customer = await this.prisma.customer.findUnique({
            where: { id },
            include: { _count: { select: { orders: true } } },
        });

        if (!customer) {
            throw new NotFoundException('Customer not found');
        }

        // If customer has a linked user account, delete from Supabase
        if (customer.userId) {
            try {
                await this.supabase.deleteUser(customer.userId);
            } catch (error) {
                this.logger.warn(`Failed to delete Supabase user: ${error.message}`);
            }
        }

        // Check if customer has orders
        if (customer._count.orders > 0) {
            // Soft delete by setting a flag or just return error
            throw new Error('Cannot delete customer with existing orders. Consider archiving instead.');
        }

        await this.prisma.customer.delete({ where: { id } });

        return { message: 'Customer deleted successfully' };
    }

    async addPoints(customerId: string, amount: number, description: string) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
        });

        if (!customer) {
            throw new NotFoundException('Customer not found');
        }

        const newBalance = customer.points + amount;

        await this.prisma.$transaction([
            this.prisma.customer.update({
                where: { id: customerId },
                data: { points: newBalance },
            }),
            this.prisma.pointsTransaction.create({
                data: {
                    customerId,
                    amount,
                    type: amount > 0 ? 'EARN' : 'REDEEM',
                    description,
                },
            }),
        ]);

        return { points: newBalance };
    }
}
