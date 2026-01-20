// Benefits Types

export interface DiscountRule {
    id: string;
    name: string;
    description: string;
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    customerTypes: string[];
    minOrderAmount?: number;
    maxDiscount?: number;
    isActive: boolean;
    validFrom?: string;
    validUntil?: string;
    usageLimit?: number;
    usageCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface PointsRule {
    id: string;
    name: string;
    description: string;
    earnRate: number;
    redemptionRate: number;
    customerTypes: string[];
    minPointsToRedeem: number;
    maxPointsPerOrder?: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface DiscountCodeUsage {
    id: string;
    customerId: string;
    customerName: string;
    customerType: string;
    orderId: string;
    orderTotal: number;
    discountAmount: number;
    usedAt: string;
}

export interface AssignedCustomer {
    id: string;
    customerId: string;
    customerName: string;
    customerType: string;
    assignedAt: string;
}

export interface DiscountCode {
    id: string;
    code: string;
    type: 'GENERIC' | 'EXCLUSIVE';
    description: string;
    discountPercent: number;
    isActive: boolean;
    usageCount: number;
    uniqueUsersCount: number;
    assignedTo?: {
        customerId: string;
        customerName: string;
        customerType: string;
    };
    assignedCustomers?: AssignedCustomer[];
    usageHistory?: DiscountCodeUsage[];
    createdAt: string;
    expiresAt?: string;
}

// Promo codes that are assigned to a customer for their use at checkout
export interface AssignedPromoCode {
    id: string;
    code: string;
    discountPercent: number;
    description: string;
    usageLimit?: number;
    usedCount: number;
    isActive: boolean;
    expiresAt?: string;
    assignedAt: string;
}

// ==================== Credits (代金券/储值余额) ====================

export type CreditSource = 'PROMOTION' | 'BIRTHDAY' | 'REFERRAL' | 'COMPENSATION' | 'MANUAL';

export interface CustomerCredit {
    id: string;
    customerId: string;
    customerName?: string;
    customerType?: string;
    amount: number;
    minOrderAmount: number;
    name: string;
    description?: string;
    source: CreditSource;
    batchId?: string;
    isUsed: boolean;
    isActive: boolean;
    expiresAt?: string;
    createdAt: string;
    usedAt?: string;
}

export interface CreditBatch {
    batchId: string;
    name: string;
    source: CreditSource;
    amount: number;
    minOrderAmount: number;
    totalIssued: number;
    usedCount: number;
    totalValue: number;
    createdAt: string;
    expiresAt?: string;
}

export interface CreditStats {
    totalIssued: number;
    totalUsed: number;
    totalActive: number;
    totalExpired: number;
    totalValue: number;
    usedValue: number;
    usageRate: number;
}

export interface IssueCreditRequest {
    name: string;
    description?: string;
    amount: number;
    minOrderAmount: number;
    source?: CreditSource;
    expiresInDays?: number | null;  // null means never expires
}

export interface IssueByTypeRequest extends IssueCreditRequest {
    customerTypes: string[];
}

export interface IssueByListsRequest extends IssueCreditRequest {
    listIds: string[];
}

export interface IssueByCustomersRequest extends IssueCreditRequest {
    customerIds: string[];
}

