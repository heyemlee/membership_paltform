// SMS Types

export type SMSStatus = 'DRAFT' | 'SCHEDULED' | 'SENT' | 'CANCELLED';
export type RecipientFilter = 'ALL' | 'GC' | 'DESIGNER' | 'REGULAR' | 'WHOLESALE';
export type ContactListType = 'CUSTOMER_SYNC' | 'MANUAL_IMPORT';

export interface SMSCampaign {
    id: string;
    name: string;
    message: string;
    status: SMSStatus;
    recipientFilter: RecipientFilter;
    recipientCount: number;
    sentCount?: number;
    scheduledAt?: string;
    sentAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface SMSTemplate {
    id: string;
    name: string;
    content: string;
    createdAt: string;
}

export interface CreateSMSCampaignInput {
    name: string;
    message: string;
    recipientFilter: RecipientFilter;
    scheduledAt?: string;
}

// Contact - individual person in a list
export interface Contact {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    customerId?: string; // Linked to Customer if synced from customers
    customerType?: string; // GC, DESIGNER, REGULAR, WHOLESALE
    createdAt: string;
}

// Contact List - can be synced from customers or manually imported
export interface ContactList {
    id: string;
    name: string;
    description?: string;
    type: ContactListType;
    filterCriteria?: {
        customerTypes?: string[];
    };
    count: number;
    lastSyncedAt?: string;
    createdAt: string;
    updatedAt: string;
    contacts?: Contact[]; // Only populated when viewing detail
}

// Input DTOs
export interface CreateContactListInput {
    name: string;
    description?: string;
    type: ContactListType;
    filterCriteria?: {
        customerTypes?: string[];
    };
}

export interface ImportContactInput {
    name: string;
    phone?: string;
    email?: string;
}

export interface ImportContactsInput {
    listId: string;
    contacts: ImportContactInput[];
}

