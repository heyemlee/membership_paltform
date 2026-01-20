import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
    CreateContactListDto,
    ImportContactsDto,
    AddContactDto,
    SyncCustomersDto,
    UpdateContactListDto,
    ContactListType,
} from './dto';

@Injectable()
export class ContactsService {
    private readonly logger = new Logger(ContactsService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Format phone number to standard US format: (XXX) XXX-XXXX
     */
    private formatPhone(phone: string | undefined | null): string | undefined {
        if (!phone) return undefined;

        const digits = phone.replace(/\D/g, '');

        if (digits.length === 0) return undefined;
        if (digits.length < 10) return phone; // Return as-is if too short

        if (digits.length === 10) {
            return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        }

        if (digits.length === 11 && digits[0] === '1') {
            return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
        }

        return `(${digits.slice(-10, -7)}) ${digits.slice(-7, -4)}-${digits.slice(-4)}`;
    }

    // ==================== Contact Lists ====================

    async getAllLists() {
        const lists = await this.prisma.contactList.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { contacts: true },
                },
            },
        });

        return lists.map(list => ({
            id: list.id,
            name: list.name,
            description: list.description,
            type: list.type,
            filterCriteria: list.filterCriteria,
            count: list._count.contacts,
            lastSyncedAt: list.lastSyncedAt?.toISOString(),
            createdAt: list.createdAt.toISOString(),
            updatedAt: list.updatedAt.toISOString(),
        }));
    }

    async getListById(id: string) {
        const list = await this.prisma.contactList.findUnique({
            where: { id },
            include: {
                contacts: {
                    orderBy: { createdAt: 'desc' },
                    take: 100, // Limit to 100 contacts for performance
                },
                _count: {
                    select: { contacts: true },
                },
            },
        });

        if (!list) {
            throw new NotFoundException('Contact list not found');
        }

        return {
            id: list.id,
            name: list.name,
            description: list.description,
            type: list.type,
            filterCriteria: list.filterCriteria,
            count: list._count.contacts,
            lastSyncedAt: list.lastSyncedAt?.toISOString(),
            createdAt: list.createdAt.toISOString(),
            updatedAt: list.updatedAt.toISOString(),
            contacts: list.contacts.map(c => ({
                id: c.id,
                name: c.name,
                phone: c.phone,
                email: c.email,
                customerId: c.customerId,
                customerType: c.customerType,
                createdAt: c.createdAt.toISOString(),
            })),
        };
    }

    async createList(dto: CreateContactListDto) {
        const list = await this.prisma.contactList.create({
            data: {
                name: dto.name,
                description: dto.description,
                type: dto.type,
                filterCriteria: dto.filterCriteria,
            },
        });

        // If it's a customer sync list, perform initial sync
        if (dto.type === 'CUSTOMER_SYNC') {
            await this.syncCustomersToList(list.id, dto.filterCriteria?.customerTypes);
        }

        return this.getListById(list.id);
    }

    async updateList(id: string, dto: UpdateContactListDto) {
        const list = await this.prisma.contactList.update({
            where: { id },
            data: {
                name: dto.name,
                description: dto.description,
            },
        });

        return this.getListById(list.id);
    }

    async deleteList(id: string) {
        await this.prisma.contactList.delete({
            where: { id },
        });
        return { success: true, message: 'Contact list deleted' };
    }

    // ==================== Contacts Management ====================

    async addContact(listId: string, dto: AddContactDto) {
        const list = await this.prisma.contactList.findUnique({ where: { id: listId } });
        if (!list) {
            throw new NotFoundException('Contact list not found');
        }

        const contact = await this.prisma.contact.create({
            data: {
                listId,
                name: dto.name,
                phone: dto.phone,
                email: dto.email,
            },
        });

        // Update list count
        await this.updateListCount(listId);

        return contact;
    }

    async importContacts(dto: ImportContactsDto) {
        const list = await this.prisma.contactList.findUnique({ where: { id: dto.listId } });
        if (!list) {
            throw new NotFoundException('Contact list not found');
        }

        if (list.type !== 'MANUAL_IMPORT') {
            throw new BadRequestException('Cannot import contacts to a customer sync list');
        }

        // Batch create contacts with formatted phone numbers
        const contacts = await this.prisma.contact.createMany({
            data: dto.contacts.map(c => ({
                listId: dto.listId,
                name: c.name,
                phone: this.formatPhone(c.phone) || c.phone,
                email: c.email,
            })),
        });

        // Update list count
        await this.updateListCount(dto.listId);

        return {
            success: true,
            message: `Imported ${contacts.count} contacts`,
            count: contacts.count,
        };
    }

    async removeContact(contactId: string) {
        const contact = await this.prisma.contact.findUnique({ where: { id: contactId } });
        if (!contact) {
            throw new NotFoundException('Contact not found');
        }

        await this.prisma.contact.delete({ where: { id: contactId } });
        await this.updateListCount(contact.listId);

        return { success: true };
    }

    // ==================== Customer Sync ====================

    async syncCustomersToList(listId: string, customerTypes?: string[]) {
        const list = await this.prisma.contactList.findUnique({ where: { id: listId } });
        if (!list) {
            throw new NotFoundException('Contact list not found');
        }

        // Get filter from list or use provided filter
        const types = customerTypes || (list.filterCriteria as any)?.customerTypes;

        // Build customer query
        const whereClause = types && types.length > 0
            ? { type: { in: types } }
            : {};

        // Get all matching customers
        const customers = await this.prisma.customer.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                type: true,
            },
        });

        // Delete existing contacts in this list
        await this.prisma.contact.deleteMany({
            where: { listId },
        });

        // Add customers as contacts
        if (customers.length > 0) {
            await this.prisma.contact.createMany({
                data: customers.map(c => ({
                    listId,
                    customerId: c.id,
                    customerType: c.type,
                    name: c.name,
                    phone: c.phone,
                    email: c.email,
                })),
            });
        }

        // Update list metadata
        await this.prisma.contactList.update({
            where: { id: listId },
            data: {
                count: customers.length,
                lastSyncedAt: new Date(),
                filterCriteria: types ? { customerTypes: types } : undefined,
            },
        });

        this.logger.log(`Synced ${customers.length} customers to list ${list.name}`);

        return {
            success: true,
            message: `Synced ${customers.length} customers`,
            count: customers.length,
        };
    }

    async createCustomerSyncList(name: string, description: string, customerTypes?: string[]) {
        const list = await this.prisma.contactList.create({
            data: {
                name,
                description,
                type: 'CUSTOMER_SYNC',
                filterCriteria: customerTypes ? { customerTypes } : { customerTypes: [] },
            },
        });

        // Perform initial sync
        await this.syncCustomersToList(list.id, customerTypes);

        return this.getListById(list.id);
    }

    // ==================== Helpers ====================

    private async updateListCount(listId: string) {
        const count = await this.prisma.contact.count({
            where: { listId },
        });

        await this.prisma.contactList.update({
            where: { id: listId },
            data: { count },
        });
    }

    // Get contacts for SMS sending (used by SMS service)
    async getContactsForSending(listIds: string[]) {
        const contacts = await this.prisma.contact.findMany({
            where: {
                listId: { in: listIds },
                phone: { not: null },
            },
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
            },
            distinct: ['phone'], // Avoid duplicate phone numbers
        });

        return contacts;
    }

    // Parse imported data (helper for frontend to validate CSV/Excel)
    parseImportData(rawData: any[]): ImportContactsDto['contacts'] {
        return rawData.map(row => {
            // Try to find name, phone, email in various column names
            const name = row.name || row.Name || row.NAME ||
                row['Customer Name'] || row['customer_name'] ||
                row['Full Name'] || row.full_name || '';

            const phone = row.phone || row.Phone || row.PHONE ||
                row['Phone Number'] || row['phone_number'] ||
                row.mobile || row.Mobile || row.cell || '';

            const email = row.email || row.Email || row.EMAIL ||
                row['Email Address'] || row['email_address'] || '';

            return { name, phone, email };
        }).filter(c => c.name || c.phone || c.email); // Filter out empty rows
    }
}
