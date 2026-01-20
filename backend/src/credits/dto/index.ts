// Credits DTOs
import { IsString, IsNumber, IsOptional, IsArray, IsEnum, Min } from 'class-validator';

export class IssueCreditDto {
    @IsString()
    name: string;                        // 代金券名称

    @IsOptional()
    @IsString()
    description?: string;                // 详细描述

    @IsNumber()
    @Min(0)
    amount: number;                      // 金额

    @IsNumber()
    @Min(0)
    minOrderAmount: number;              // 最低消费门槛

    @IsOptional()
    @IsEnum(['PROMOTION', 'BIRTHDAY', 'REFERRAL', 'COMPENSATION', 'MANUAL'])
    source?: 'PROMOTION' | 'BIRTHDAY' | 'REFERRAL' | 'COMPENSATION' | 'MANUAL';

    @IsOptional()
    @IsNumber()
    expiresInDays?: number;              // 有效天数，null表示永不过期
}

export class IssueByTypeDto extends IssueCreditDto {
    @IsArray()
    @IsString({ each: true })
    customerTypes: string[];             // 按客户类型发放
}

export class IssueByListsDto extends IssueCreditDto {
    @IsArray()
    @IsString({ each: true })
    listIds: string[];                   // 按联系人列表发放
}

export class IssueByCustomersDto extends IssueCreditDto {
    @IsArray()
    @IsString({ each: true })
    customerIds: string[];               // 按客户ID列表发放
}

export class UseCreditDto {
    @IsString()
    orderId: string;

    @IsNumber()
    @Min(0)
    orderTotal: number;
}
