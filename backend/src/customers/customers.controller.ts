import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto, CustomerQueryDto, AddPointsDto, BulkImportCustomersDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
    constructor(private customersService: CustomersService) { }

    @Get()
    async findAll(@Query() query: CustomerQueryDto) {
        return this.customersService.findAll(query);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.customersService.findOne(id);
    }

    @Post()
    async create(@Body() createDto: CreateCustomerDto) {
        return this.customersService.create(createDto);
    }

    @Post('bulk-import')
    async bulkImport(@Body() bulkImportDto: BulkImportCustomersDto) {
        return this.customersService.bulkImport(
            bulkImportDto.type,
            bulkImportDto.customers,
            bulkImportDto.skipDuplicates ?? true
        );
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() updateDto: UpdateCustomerDto) {
        return this.customersService.update(id, updateDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.customersService.remove(id);
    }

    @Post(':id/points')
    async addPoints(@Param('id') id: string, @Body() addPointsDto: AddPointsDto) {
        return this.customersService.addPoints(id, addPointsDto.amount, addPointsDto.description);
    }
}
