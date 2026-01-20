import { IsArray, IsString } from 'class-validator';

export class BatchAssignByTypeDto {
    @IsArray()
    @IsString({ each: true })
    customerTypes: string[];
}

export class BatchAssignByListsDto {
    @IsArray()
    @IsString({ each: true })
    listIds: string[];
}
