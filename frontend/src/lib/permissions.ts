// Role-based Access Control
import { UserRole } from '@/types';

export type Permission = keyof typeof permissions;

export const permissions = {
    // Pages
    'page:overview': ['ADMIN', 'STAFF'],
    'page:customers': ['ADMIN', 'STAFF'],
    'page:customers:detail': ['ADMIN', 'STAFF'],
    'page:orders': ['ADMIN', 'STAFF'],
    'page:benefits': ['ADMIN', 'STAFF'],
    'page:sms:campaigns': ['ADMIN', 'STAFF'],
    'page:sms:create': ['ADMIN'],
    'page:integrations': ['ADMIN'],
    'page:settings': ['ADMIN'],

    // Actions
    'action:customer:create': ['ADMIN', 'STAFF'],
    'action:customer:update': ['ADMIN', 'STAFF'],
    'action:customer:delete': ['ADMIN'],
    'action:order:sync': ['ADMIN'],
    'action:sms:send': ['ADMIN'],
    'action:sms:create': ['ADMIN'],
    'action:benefits:edit': ['ADMIN'],
    'action:settings:update': ['ADMIN'],
    'action:quickbooks:connect': ['ADMIN'],
} as const;

export function hasPermission(role: UserRole | null, permission: Permission): boolean {
    if (!role) return false;
    return (permissions[permission] as readonly string[]).includes(role);
}

export function getAccessiblePages(role: UserRole | null): string[] {
    if (!role) return [];

    return Object.entries(permissions)
        .filter(([key, roles]) => key.startsWith('page:') && (roles as readonly string[]).includes(role))
        .map(([key]) => key.replace('page:', ''));
}
