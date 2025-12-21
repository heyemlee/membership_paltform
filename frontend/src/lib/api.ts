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
        const user = localStorage.getItem('user');
        if (user) {
            // In production, this would be a real JWT token
            headers['Authorization'] = `Bearer mock-token`;
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
    },
    orders: {
        list: '/orders',
        detail: (id: string) => `/orders/${id}`,
        sync: '/orders/sync',
    },
    benefits: {
        discountRules: '/benefits/discount-rules',
        pointsRules: '/benefits/points-rules',
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
    },
};
