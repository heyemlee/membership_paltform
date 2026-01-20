import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { SmsService } from './sms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sms')
@UseGuards(JwtAuthGuard)
export class SmsController {
    constructor(private smsService: SmsService) { }

    @Get('campaigns')
    async getCampaigns() {
        return this.smsService.getCampaigns();
    }

    @Post('campaigns')
    async createCampaign(@Body() data: { name: string; message: string; recipientFilter: string; scheduledAt?: string }) {
        return this.smsService.createCampaign(data);
    }

    @Post('campaigns/:id/send')
    async sendCampaign(@Param('id') id: string) {
        return this.smsService.sendCampaign(id);
    }

    @Get('templates')
    async getTemplates() {
        return this.smsService.getTemplates();
    }

    @Post('templates')
    async createTemplate(@Body() data: { name: string; content: string }) {
        return this.smsService.createTemplate(data);
    }
}
