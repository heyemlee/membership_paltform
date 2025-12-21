'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getCurrentUser, logout } from '@/lib/auth';
import { User, LogOut, Settings } from 'lucide-react';

export function Topbar() {
    const router = useRouter();
    const user = getCurrentUser();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
            {/* Environment Badge */}
            <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                    Demo Mode
                </Badge>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
                {user && (
                    <>
                        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                            {user.role}
                        </Badge>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="gap-2">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-4 w-4 text-primary" />
                                    </div>
                                    <span className="hidden md:inline">{user.name}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </>
                )}
            </div>
        </header>
    );
}
