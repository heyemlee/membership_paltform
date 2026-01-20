import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
    constructor(private settingsService: SettingsService) { }

    @Get()
    async getAll() {
        return this.settingsService.getAll();
    }

    @Put('discount-rates')
    async updateDiscountRates(@Body() data: { GC?: number; DESIGNER?: number; WHOLESALE?: number }) {
        return this.settingsService.updateDiscountRates(data);
    }

    @Put('points-config')
    async updatePointsConfig(@Body() data: { earnRate?: number; pointsPerDollar?: number; minRedeemPoints?: number }) {
        return this.settingsService.updatePointsConfig(data);
    }

    @Put('wholesale-config')
    async updateWholesaleConfig(@Body() data: {
        initialShareDiscount?: number;
        upgradeThreshold?: number;
        upgradedShareDiscount?: number;
        commissionWithdrawThreshold?: number;
    }) {
        return this.settingsService.updateWholesaleConfig(data);
    }
}
