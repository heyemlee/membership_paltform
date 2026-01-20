import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import {
    CreateContactListDto,
    ImportContactsDto,
    AddContactDto,
    SyncCustomersDto,
    UpdateContactListDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
    constructor(private readonly contactsService: ContactsService) { }

    // ==================== Contact Lists ====================

    @Get('lists')
    async getAllLists() {
        return this.contactsService.getAllLists();
    }

    @Get('lists/:id')
    async getListById(@Param('id', ParseUUIDPipe) id: string) {
        return this.contactsService.getListById(id);
    }

    @Post('lists')
    async createList(@Body() dto: CreateContactListDto) {
        return this.contactsService.createList(dto);
    }

    @Put('lists/:id')
    async updateList(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateContactListDto,
    ) {
        return this.contactsService.updateList(id, dto);
    }

    @Delete('lists/:id')
    async deleteList(@Param('id', ParseUUIDPipe) id: string) {
        return this.contactsService.deleteList(id);
    }

    // ==================== Contacts Management ====================

    @Post('lists/:id/contacts')
    async addContact(
        @Param('id', ParseUUIDPipe) listId: string,
        @Body() dto: AddContactDto,
    ) {
        return this.contactsService.addContact(listId, dto);
    }

    @Post('import')
    async importContacts(@Body() dto: ImportContactsDto) {
        return this.contactsService.importContacts(dto);
    }

    @Delete(':id')
    async removeContact(@Param('id', ParseUUIDPipe) id: string) {
        return this.contactsService.removeContact(id);
    }

    // ==================== Customer Sync ====================

    @Post('lists/:id/sync')
    async syncCustomersToList(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: SyncCustomersDto,
    ) {
        return this.contactsService.syncCustomersToList(id, dto.customerTypes);
    }

    @Post('lists/from-customers')
    async createCustomerSyncList(
        @Body() body: { name: string; description?: string; customerTypes?: string[] },
    ) {
        return this.contactsService.createCustomerSyncList(
            body.name,
            body.description || '',
            body.customerTypes,
        );
    }

    // ==================== Helpers ====================

    @Get('lists/:id/for-sending')
    async getContactsForSending(@Param('id', ParseUUIDPipe) id: string) {
        return this.contactsService.getContactsForSending([id]);
    }
}
