import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SMSStatus } from '@prisma/client';

@Injectable()
export class SmsService {
    private readonly logger = new Logger(SmsService.name);

    constructor(private prisma: PrismaService) { }

    async getCampaigns() {
        const campaigns = await this.prisma.sMSCampaign.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return campaigns.map(c => ({
            id: c.id,
            name: c.name,
            message: c.message,
            status: c.status,
            recipientFilter: c.recipientFilter,
            recipientCount: c.recipientCount,
            sentCount: c.sentCount,
            scheduledAt: c.scheduledAt?.toISOString(),
            sentAt: c.sentAt?.toISOString(),
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
        }));
    }

    async createCampaign(data: {
        name: string;
        message: string;
        recipientFilter: string;
        scheduledAt?: string;
    }) {
        // Count recipients based on filter
        let recipientCount = 0;
        if (data.recipientFilter === 'ALL') {
            recipientCount = await this.prisma.customer.count();
        } else {
            recipientCount = await this.prisma.customer.count({
                where: { type: data.recipientFilter as any },
            });
        }

        return this.prisma.sMSCampaign.create({
            data: {
                name: data.name,
                message: data.message,
                recipientFilter: data.recipientFilter,
                recipientCount,
                scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
                status: data.scheduledAt ? 'SCHEDULED' : 'DRAFT',
            },
        });
    }

    async sendCampaign(id: string) {
        const campaign = await this.prisma.sMSCampaign.findUnique({
            where: { id },
        });

        if (!campaign) {
            throw new Error('Campaign not found');
        }

        // In production, integrate with SMS provider (Twilio, etc.)
        this.logger.log(`Sending SMS campaign: ${campaign.name}`);

        // Simulate sending
        const updatedCampaign = await this.prisma.sMSCampaign.update({
            where: { id },
            data: {
                status: 'SENT',
                sentAt: new Date(),
                sentCount: campaign.recipientCount,
            },
        });

        return {
            message: 'Campaign sent successfully',
            sentCount: updatedCampaign.sentCount,
        };
    }

    async getTemplates() {
        return this.prisma.sMSTemplate.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async createTemplate(data: { name: string; content: string }) {
        return this.prisma.sMSTemplate.create({ data });
    }
}
