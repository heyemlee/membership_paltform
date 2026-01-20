import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrderStatus } from '@prisma/client';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
    constructor(private ordersService: OrdersService) { }

    @Get()
    async findAll(@Query() query: { page?: string; limit?: string; status?: string; customerId?: string }) {
        const parsedQuery = {
            page: query.page ? parseInt(query.page, 10) : undefined,
            limit: query.limit ? parseInt(query.limit, 10) : undefined,
            status: query.status,
            customerId: query.customerId,
        };
        return this.ordersService.findAll(parsedQuery);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.ordersService.findOne(id);
    }

    @Post()
    async create(@Body() data: {
        customerId: string;
        customerName: string;
        items: { name: string; quantity: number; unitPrice: number }[];
        discountCode?: string;
        pointsToRedeem?: number;
    }) {
        return this.ordersService.create(data);
    }

    @Patch(':id/status')
    async updateStatus(@Param('id') id: string, @Body('status') status: OrderStatus) {
        return this.ordersService.updateStatus(id, status);
    }

    @Post('sync')
    async sync() {
        return this.ordersService.syncFromQuickBooks();
    }
}
