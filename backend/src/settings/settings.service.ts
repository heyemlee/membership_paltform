import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SettingsService {
    constructor(private prisma: PrismaService) { }

    async getAll() {
        const settings = await this.prisma.systemSetting.findMany();

        // Convert to key-value object
        const result: Record<string, any> = {};
        for (const setting of settings) {
            result[setting.key] = setting.value;
        }

        // Provide defaults if not set
        return {
            discountRates: result['discount_rates'] || { GC: 25, DESIGNER: 25, WHOLESALE: 25 },
            pointsConfig: result['points_config'] || {
                earnRate: 1,
                pointsPerDollar: 100,
                minRedeemPoints: 100
            },
            wholesaleConfig: result['wholesale_config'] || {
                initialShareDiscount: 20,
                upgradeThreshold: 10000,
                upgradedShareDiscount: 25,
                commissionWithdrawThreshold: 500,
            },
        };
    }

    async updateDiscountRates(data: { GC?: number; DESIGNER?: number; WHOLESALE?: number }) {
        const existing = await this.prisma.systemSetting.findUnique({
            where: { key: 'discount_rates' },
        });

        if (existing) {
            return this.prisma.systemSetting.update({
                where: { key: 'discount_rates' },
                data: { value: { ...existing.value as object, ...data } },
            });
        }

        return this.prisma.systemSetting.create({
            data: {
                key: 'discount_rates',
                value: data,
                description: 'Discount rates by customer type',
            },
        });
    }

    async updatePointsConfig(data: { earnRate?: number; pointsPerDollar?: number; minRedeemPoints?: number }) {
        const existing = await this.prisma.systemSetting.findUnique({
            where: { key: 'points_config' },
        });

        if (existing) {
            return this.prisma.systemSetting.update({
                where: { key: 'points_config' },
                data: { value: { ...existing.value as object, ...data } },
            });
        }

        return this.prisma.systemSetting.create({
            data: {
                key: 'points_config',
                value: data,
                description: 'Points system configuration',
            },
        });
    }

    async updateWholesaleConfig(data: {
        initialShareDiscount?: number;
        upgradeThreshold?: number;
        upgradedShareDiscount?: number;
        commissionWithdrawThreshold?: number;
    }) {
        const existing = await this.prisma.systemSetting.findUnique({
            where: { key: 'wholesale_config' },
        });

        if (existing) {
            return this.prisma.systemSetting.update({
                where: { key: 'wholesale_config' },
                data: { value: { ...existing.value as object, ...data } },
            });
        }

        return this.prisma.systemSetting.create({
            data: {
                key: 'wholesale_config',
                value: data,
                description: 'Wholesale program configuration',
            },
        });
    }
}
