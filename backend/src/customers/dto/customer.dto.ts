import { IsString, IsEmail, IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateCustomerDto {
    @IsString()
    name: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    phone: string;

    @IsString()
    @IsOptional()
    type?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(100)
    discountRate?: number;

    @IsString()
    @IsOptional()
    customDiscountCode?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(100)
    customDiscountRate?: number;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateCustomerDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    type?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(100)
    discountRate?: number;

    @IsString()
    @IsOptional()
    customDiscountCode?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(100)
    customDiscountRate?: number;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class CustomerQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc' = 'desc';
}

export class AddPointsDto {
    @IsNumber()
    amount: number;

    @IsString()
    description: string;
}
