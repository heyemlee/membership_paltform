import { IsString, IsOptional, IsEnum, IsArray, ValidateNested, IsUUID, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export enum ContactListType {
    CUSTOMER_SYNC = 'CUSTOMER_SYNC',
    MANUAL_IMPORT = 'MANUAL_IMPORT',
}

// DTO for creating a new contact list
export class CreateContactListDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsEnum(ContactListType)
    type: ContactListType;

    @IsOptional()
    @IsObject()
    filterCriteria?: {
        customerTypes?: string[];
    };
}

// DTO for importing contacts from Excel/CSV
export class ImportContactDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    email?: string;
}

export class ImportContactsDto {
    @IsUUID()
    listId: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ImportContactDto)
    contacts: ImportContactDto[];
}

// DTO for adding a single contact manually
export class AddContactDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    email?: string;
}

// DTO for syncing customers to a list
export class SyncCustomersDto {
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    customerTypes?: string[];
}

// DTO for updating contact list
export class UpdateContactListDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;
}
