// Customer Types

export type CustomerType = 'REGULAR' | 'GC' | 'DESIGNER' | 'WHOLESALE' | 'OTHER';

export interface Customer {
    id: string;
    name: string;
    email?: string;
    phone: string;
    type: CustomerType;
    points: number;
    discountRate: number;
    customDiscountCode?: string;
    customDiscountRate?: number;
    createdAt: string;
    updatedAt: string;
}

export interface CustomerDetail extends Customer {
    orders: CustomerOrder[];
    pointsHistory: PointsTransaction[];
    notes?: string;
}

export interface CustomerOrder {
    id: string;
    customerId: string;
    total: number;
    status: string;
    createdAt: string;
    items: OrderItem[];
}

export interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
}

export interface PointsTransaction {
    id: string;
    customerId: string;
    amount: number;
    type: 'EARN' | 'REDEEM';
    description: string;
    createdAt: string;
}
