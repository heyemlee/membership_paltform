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
