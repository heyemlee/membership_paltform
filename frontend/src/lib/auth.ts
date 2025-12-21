// Auth utilities - Mock implementation
import { User, UserRole } from '@/types';

// Mock users for demo
const MOCK_USERS: Record<string, { password: string; user: User }> = {
    'admin@example.com': {
        password: 'admin',
        user: {
            id: 'user-001',
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'ADMIN',
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
        },
    },
    'staff@example.com': {
        password: 'staff',
        user: {
            id: 'user-002',
            email: 'staff@example.com',
            name: 'Staff Member',
            role: 'STAFF',
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
        },
    },
};

// Auth state (client-side only)
let currentUser: User | null = null;

export function login(email: string, password: string): User | null {
    const entry = MOCK_USERS[email];
    if (entry && entry.password === password) {
        currentUser = entry.user;
        if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(entry.user));
        }
        return entry.user;
    }
    return null;
}

export function logout(): void {
    currentUser = null;
    if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
    }
}

export function getCurrentUser(): User | null {
    if (currentUser) return currentUser;
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('user');
        // Check if stored value exists and is not the string "undefined" or "null"
        if (stored && stored !== 'undefined' && stored !== 'null') {
            try {
                currentUser = JSON.parse(stored);
                return currentUser;
            } catch (error) {
                // If JSON parsing fails, clear the corrupted data
                console.error('Failed to parse user data from localStorage:', error);
                localStorage.removeItem('user');
                return null;
            }
        }
    }
    return null;
}

export function isAuthenticated(): boolean {
    return getCurrentUser() !== null;
}

export function getUserRole(): UserRole | null {
    const user = getCurrentUser();
    return user?.role || null;
}
