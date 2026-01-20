import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Normalize phone number by removing all non-digit characters
 * @example "123-456-7890" -> "1234567890"
 * @example "(123) 456 7890" -> "1234567890"
 */
export function normalizePhone(phone: string): string {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
}

/**
 * Format phone number to standard US format: (XXX) XXX-XXXX
 * @example "1234567890" -> "(123) 456-7890"
 * @example "123-456-7890" -> "(123) 456-7890"
 */
export function formatPhone(phone: string): string {
    if (!phone) return '';

    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // Handle different lengths
    if (digits.length === 0) return '';
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;

    // For numbers with country code (11+ digits)
    if (digits.length === 11 && digits[0] === '1') {
        return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }

    // For longer international numbers, just format the last 10 digits
    return `(${digits.slice(-10, -7)}) ${digits.slice(-7, -4)}-${digits.slice(-4)}`;
}

/**
 * Format phone as user types (for input fields)
 * Returns formatted value for display
 */
export function formatPhoneInput(value: string): string {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');

    // Limit to 10 digits for US numbers
    const limited = digits.slice(0, 10);

    // Format as user types
    if (limited.length === 0) return '';
    if (limited.length <= 3) return `(${limited}`;
    if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
}
