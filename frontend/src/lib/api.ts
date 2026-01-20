// API Client - Fetch wrapper
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface ApiError {
    message: string;
    status: number;
}

async function fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Add auth token if available
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error: ApiError = {
            message: `API Error: ${response.statusText}`,
            status: response.status,
        };
        throw error;
    }

    return response.json();
}

export const api = {
    get: <T>(endpoint: string) => fetchApi<T>(endpoint, { method: 'GET' }),
    post: <T>(endpoint: string, data: unknown) =>
        fetchApi<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }),
    put: <T>(endpoint: string, data: unknown) =>
        fetchApi<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
    delete: <T>(endpoint: string) => fetchApi<T>(endpoint, { method: 'DELETE' }),
};

// API Endpoints
export const endpoints = {
    customers: {
        list: '/customers',
        detail: (id: string) => `/customers/${id}`,
        create: '/customers',
        update: (id: string) => `/customers/${id}`,
        delete: (id: string) => `/customers/${id}`,
        promoCodes: (id: string) => `/customers/${id}/promo-codes`,
        addPromoCode: (id: string) => `/customers/${id}/promo-codes`,
        removePromoCode: (id: string, codeId: string) => `/customers/${id}/promo-codes/${codeId}`,
    },
    orders: {
        list: '/orders',
        detail: (id: string) => `/orders/${id}`,
        create: '/orders',
        sync: '/orders/sync',
    },
    benefits: {
        discountRules: '/benefits/discount-rules',
        pointsRules: '/benefits/points-rules',
        discountCodes: '/benefits/discount-codes',
        discountCodeDetail: (id: string) => `/benefits/discount-codes/${id}`,
    },
    sms: {
        campaigns: '/sms/campaigns',
        send: (id: string) => `/sms/campaigns/${id}/send`,
        templates: '/sms/templates',
    },
    dashboard: {
        stats: '/dashboard/stats',
    },
    settings: {
        all: '/settings',
        discountRates: '/settings/discount-rates',
        pointsConfig: '/settings/points-config',
        wholesaleConfig: '/settings/wholesale-config',
    },
    quickbooks: {
        status: '/quickbooks/status',
        authUrl: '/quickbooks/auth-url',
        disconnect: '/quickbooks/disconnect',
        syncCustomers: '/quickbooks/sync/customers',
        syncOrders: '/quickbooks/sync/orders',
        discountHelper: '/quickbooks/discount-helper/lookup',
        calculateDiscount: '/quickbooks/discount-helper/calculate',
        syncStats: '/quickbooks/sync-stats',
        syncLogs: '/quickbooks/sync-logs',
    },
};
