import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { BenefitsService } from './benefits.service';
import { BatchAssignByTypeDto, BatchAssignByListsDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('benefits')
@UseGuards(JwtAuthGuard)
export class BenefitsController {
    constructor(private benefitsService: BenefitsService) { }

    // Discount Rules
    @Get('discount-rules')
    async getDiscountRules() {
        return this.benefitsService.getDiscountRules();
    }

    @Post('discount-rules')
    async createDiscountRule(@Body() data: any) {
        return this.benefitsService.createDiscountRule(data);
    }

    @Put('discount-rules/:id')
    async updateDiscountRule(@Param('id') id: string, @Body() data: any) {
        return this.benefitsService.updateDiscountRule(id, data);
    }

    @Delete('discount-rules/:id')
    async deleteDiscountRule(@Param('id') id: string) {
        return this.benefitsService.deleteDiscountRule(id);
    }

    // Points Rules
    @Get('points-rules')
    async getPointsRules() {
        return this.benefitsService.getPointsRules();
    }

    @Post('points-rules')
    async createPointsRule(@Body() data: any) {
        return this.benefitsService.createPointsRule(data);
    }

    @Put('points-rules/:id')
    async updatePointsRule(@Param('id') id: string, @Body() data: any) {
        return this.benefitsService.updatePointsRule(id, data);
    }

    @Delete('points-rules/:id')
    async deletePointsRule(@Param('id') id: string) {
        return this.benefitsService.deletePointsRule(id);
    }

    // Discount Codes
    @Get('discount-codes')
    async getDiscountCodes(@Query() query: { type?: string }) {
        return this.benefitsService.getDiscountCodes(query);
    }

    @Get('discount-codes/:id')
    async getDiscountCodeById(@Param('id') id: string) {
        return this.benefitsService.getDiscountCodeById(id);
    }

    @Post('discount-codes')
    async createDiscountCode(@Body() data: any) {
        return this.benefitsService.createDiscountCode(data);
    }

    @Put('discount-codes/:id')
    async updateDiscountCode(@Param('id') id: string, @Body() data: any) {
        return this.benefitsService.updateDiscountCode(id, data);
    }

    @Delete('discount-codes/:id')
    async deleteDiscountCode(@Param('id') id: string) {
        return this.benefitsService.deleteDiscountCode(id);
    }

    @Post('discount-codes/validate')
    async validateDiscountCode(@Body('code') code: string) {
        return this.benefitsService.validateDiscountCode(code);
    }

    // Batch Assignment
    @Post('discount-codes/:id/assign-by-type')
    async batchAssignByType(@Param('id') id: string, @Body() dto: BatchAssignByTypeDto) {
        return this.benefitsService.batchAssignByType(id, dto);
    }

    @Post('discount-codes/:id/assign-by-lists')
    async batchAssignByLists(@Param('id') id: string, @Body() dto: BatchAssignByListsDto) {
        return this.benefitsService.batchAssignByLists(id, dto);
    }

    @Delete('discount-codes/:id/assignments/:assignmentId')
    async removeAssignment(@Param('id') id: string, @Param('assignmentId') assignmentId: string) {
        return this.benefitsService.removeAssignment(id, assignmentId);
    }

    @Delete('discount-codes/:id/assignments')
    async clearAllAssignments(@Param('id') id: string) {
        return this.benefitsService.clearAllAssignments(id);
    }
}
