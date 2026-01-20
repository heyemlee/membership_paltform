import { Controller, Get, Post, Body, Param, Query, Delete } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { IssueByTypeDto, IssueByListsDto, IssueByCustomersDto, UseCreditDto } from './dto';

@Controller('credits')
export class CreditsController {
    constructor(private readonly creditsService: CreditsService) { }

    // ==================== 列表和统计 ====================

    @Get()
    async getAllCredits(@Query('status') status?: string, @Query('source') source?: string) {
        return this.creditsService.getAllCredits({ status, source });
    }

    @Get('stats')
    async getStats() {
        return this.creditsService.getStats();
    }

    @Get('batches')
    async getBatches() {
        return this.creditsService.getCreditBatches();
    }

    @Get('customer/:customerId')
    async getCustomerCredits(
        @Param('customerId') customerId: string,
        @Query('available') available?: string
    ) {
        return this.creditsService.getCustomerCredits(customerId, available === 'true');
    }

    // ==================== 发放代金券 ====================

    @Post('issue/by-type')
    async issueByType(@Body() dto: IssueByTypeDto) {
        return this.creditsService.issueByType(dto);
    }

    @Post('issue/by-lists')
    async issueByLists(@Body() dto: IssueByListsDto) {
        return this.creditsService.issueByLists(dto);
    }

    @Post('issue/by-customers')
    async issueByCustomers(@Body() dto: IssueByCustomersDto) {
        return this.creditsService.issueByCustomers(dto);
    }

    // ==================== 使用和验证 ====================

    @Post(':id/use')
    async useCredit(@Param('id') id: string, @Body() dto: UseCreditDto) {
        return this.creditsService.useCredit(id, dto);
    }

    @Get(':id/validate')
    async validateCredit(@Param('id') id: string, @Query('orderTotal') orderTotal: string) {
        return this.creditsService.validateCredit(id, Number(orderTotal));
    }

    // ==================== 撤销 ====================

    @Delete(':id')
    async revokeCredit(@Param('id') id: string) {
        return this.creditsService.revokeCredit(id);
    }

    @Delete('batch/:batchId')
    async revokeBatch(@Param('batchId') batchId: string) {
        return this.creditsService.revokeBatch(batchId);
    }
}
