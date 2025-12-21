// SMS Types

export type SMSStatus = 'DRAFT' | 'SCHEDULED' | 'SENT' | 'CANCELLED';
export type RecipientFilter = 'ALL' | 'GC' | 'DESIGNER' | 'REGULAR' | 'WHOLESALE';

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

export interface ContactList {
    id: string;
    name: string;
    description?: string;
    count: number;
    source: 'EXCEL_IMPORT' | 'MANUAL' | 'SYSTEM';
    createdAt: string;
    updatedAt: string;
}
