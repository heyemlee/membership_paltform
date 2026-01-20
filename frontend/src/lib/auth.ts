// Auth utilities - Real API implementation
import { User, UserRole } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Auth state (client-side only)
let currentUser: User | null = null;

interface LoginResponse {
    user: User;
    accessToken: string;
}

interface RegisterData {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
}

export async function login(email: string, password: string): Promise<User | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            console.error('Login failed:', response.statusText);
            return null;
        }

        const data: LoginResponse = await response.json();
        currentUser = data.user;

        if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('accessToken', data.accessToken);
        }

        return data.user;
    } catch (error) {
        console.error('Login error:', error);
        return null;
    }
}

export async function register(data: RegisterData): Promise<User | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            console.error('Registration failed:', response.statusText);
            return null;
        }

        const result: LoginResponse = await response.json();
        currentUser = result.user;

        if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(result.user));
            localStorage.setItem('accessToken', result.accessToken);
        }

        return result.user;
    } catch (error) {
        console.error('Registration error:', error);
        return null;
    }
}

export function logout(): void {
    currentUser = null;
    if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
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
                localStorage.removeItem('accessToken');
                return null;
            }
        }
    }
    return null;
}

export function isAuthenticated(): boolean {
    return getCurrentUser() !== null && typeof window !== 'undefined' && !!localStorage.getItem('accessToken');
}

export function getUserRole(): UserRole | null {
    const user = getCurrentUser();
    return user?.role || null;
}

export function getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('accessToken');
    }
    return null;
}
