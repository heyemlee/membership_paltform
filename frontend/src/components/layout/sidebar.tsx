'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { hasPermission, Permission } from '@/lib/permissions';
import { getUserRole } from '@/lib/auth';
import {
    LayoutDashboard,
    Users,
    ShoppingCart,
    Gift,
    MessageSquare,
    Settings,
    ChevronLeft,
    ChevronRight,
    Link2,
    Hexagon,
} from 'lucide-react';

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    permission: Permission;
}

const navItems: NavItem[] = [
    { label: 'Overview', href: '/', icon: LayoutDashboard, permission: 'page:overview' },
    { label: 'Customers', href: '/customers', icon: Users, permission: 'page:customers' },
    { label: 'Orders', href: '/orders', icon: ShoppingCart, permission: 'page:orders' },
    { label: 'Benefits', href: '/benefits', icon: Gift, permission: 'page:benefits' },
    { label: 'SMS', href: '/sms/campaigns', icon: MessageSquare, permission: 'page:sms:campaigns' },
    { label: 'QuickBooks', href: '/integrations/quickbooks', icon: Link2, permission: 'page:integrations' },
    { label: 'Settings', href: '/settings', icon: Settings, permission: 'page:settings' },
];

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const role = getUserRole();

    const visibleItems = navItems.filter(item => hasPermission(role, item.permission));

    return (
        <aside
            className={cn(
                'flex flex-col h-screen bg-card/80 backdrop-blur-md border-r border-border/50 transition-all duration-300 relative z-50',
                collapsed ? 'w-20' : 'w-56'
            )}
        >
            {/* Logo */}
            <div className="flex items-center h-20 px-6">
                <div className="flex items-center gap-3">
                    <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                        <Hexagon className="h-6 w-6" strokeWidth={2.5} />
                    </div>
                    {!collapsed && (
                        <span className="text-xl font-bold tracking-tight">MemberHub</span>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2 py-4 overflow-y-auto">
                {visibleItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200',
                                isActive
                                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                        >
                            <item.icon className={cn("h-5 w-5 flex-shrink-0 transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Collapse Toggle */}
            <div className={cn("p-4 border-t border-border/50", collapsed ? "flex justify-center" : "flex justify-end")}>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(!collapsed)}
                    className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
                >
                    {collapsed ? (
                        <ChevronRight className="h-5 w-5" />
                    ) : (
                        <ChevronLeft className="h-5 w-5" />
                    )}
                </Button>
            </div>
        </aside>
    );
}

