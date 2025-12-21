// Common Types - Re-exports and shared interfaces

export type UserRole = 'ADMIN' | 'STAFF';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status?: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
}

// Re-export all types
export * from './customer.js';
export * from './benefits.js';
export * from './sms.js';

// QuickBooks Order
export interface QuickBooksOrder {
    id: string;
    qbId: string;
    qbInvoiceId: string;
    customerName: string;
    customerId?: string;
    total: number;
    amount: number;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | string;
    syncStatus: 'SYNCED' | 'PENDING' | 'FAILED' | string;
    createdAt: string;
    discountCode?: string;
    items?: OrderItem[];
    // Referral tracking: when someone uses another customer's discount code
    codeOwnerId?: string;
    codeOwnerName?: string;
}

export interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface OrderItemBasic {
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

// Dashboard Stats
export interface DashboardStats {
    totalRevenue: number;
    revenueChange: number;
    activeCustomers: number;
    customersChange: number;
    totalOrders: number;
    ordersChange: number;
    pendingOrders: number;
    pendingChange: number;
    recentOrders: QuickBooksOrder[];
    topCustomers: {
        id: string;
        name: string;
        totalSpent: number;
        orderCount: number;
    }[];
}
