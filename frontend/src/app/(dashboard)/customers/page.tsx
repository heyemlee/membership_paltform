'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { mockCustomers } from '@/lib/mock-data';
import { Customer } from '@/types';
import {
    Search,
    Plus,
    Users,
    Star,
    TrendingUp,
    MoreHorizontal,
    ArrowUpRight,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const CUSTOMER_TYPE_LABELS: Record<string, { label: string; className: string; icon?: React.ElementType }> = {
    GC: { label: 'GC', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200' },
    DESIGNER: { label: 'Designer', className: 'bg-violet-100 text-violet-700 hover:bg-violet-100 border-violet-200' },
    WHOLESALE: { label: 'Wholesale', className: 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200' },
    REGULAR: { label: 'Regular', className: 'bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200' },
    OTHER: { label: 'Other', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200' },
};

export default function CustomersPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setCustomers(mockCustomers);
            setLoading(false);
        }, 600);
        return () => clearTimeout(timer);
    }, []);

    const filteredCustomers = customers.filter(customer => {
        const query = searchQuery.toLowerCase();
        return (
            customer.name.toLowerCase().includes(query) ||
            (customer.email && customer.email.toLowerCase().includes(query)) ||
            customer.phone.toLowerCase().includes(query)
        );
    });

    // Calculate stats
    const totalCustomers = customers.length;

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-red-100 text-red-700',
            'bg-orange-100 text-orange-700',
            'bg-amber-100 text-amber-700',
            'bg-green-100 text-green-700',
            'bg-emerald-100 text-emerald-700',
            'bg-teal-100 text-teal-700',
            'bg-cyan-100 text-cyan-700',
            'bg-blue-100 text-blue-700',
            'bg-indigo-100 text-indigo-700',
            'bg-violet-100 text-violet-700',
            'bg-purple-100 text-purple-700',
            'bg-fuchsia-100 text-fuchsia-700',
            'bg-pink-100 text-pink-700',
            'bg-rose-100 text-rose-700',
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    if (loading) {
        return (
            <div className="space-y-6 max-w-[1600px] mx-auto p-6">
                <div className="flex items-center justify-between mb-8">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                </div>
                <Skeleton className="h-[500px] w-full rounded-xl" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50/50 to-gray-100/50 p-8">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Customers</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage relationships, track points, and view customer history.
                        </p>
                    </div>
                    <Button
                        size="lg"
                        onClick={() => router.push('/customers/new')}
                        className="bg-black hover:bg-gray-800 text-white shadow-lg shadow-black/10 transition-all hover:shadow-black/20 hover:-translate-y-0.5 rounded-full px-6"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Add New Customer
                    </Button>
                </div>

                {/* Search Bar - Redesigned */}
                <div className="relative max-w-2xl mx-auto w-full">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <Input
                            placeholder="Search by name, email, or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-14 text-lg bg-white border-2 border-gray-200 focus:border-black focus:ring-black/10 transition-all rounded-full shadow-lg shadow-gray-200/50"
                        />
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full hover:bg-gray-100 h-10 w-10 p-0"
                                onClick={() => setSearchQuery('')}
                            >
                                <span className="sr-only">Clear</span>
                                <span className="text-xl">×</span>
                            </Button>
                        )}
                    </div>
                </div>



                {/* Main Content */}
                <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden rounded-2xl">
                    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Users className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground font-medium">Total Customers</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl font-bold text-gray-900">{totalCustomers}</span>
                                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center">
                                            <ArrowUpRight className="h-3 w-3 mr-0.5" />
                                            +12%
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {searchQuery && (
                                <div className="text-sm text-muted-foreground bg-gray-50 px-3 py-1.5 rounded-full">
                                    Found {filteredCustomers.length} result{filteredCustomers.length !== 1 ? 's' : ''}
                                </div>
                            )}
                        </div>
                    </div>

                    <CardContent className="p-0">
                        {filteredCustomers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="bg-gray-50 p-4 rounded-full mb-4">
                                    <Users className="h-8 w-8 text-muted-foreground opacity-50" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">No customers found</h3>
                                <p className="text-muted-foreground max-w-sm mt-2">
                                    We couldn't find any customers matching your search. Try adjusting terms or add a new customer.
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-gray-100 bg-gray-50/50">
                                        <TableHead className="pl-6 h-12 font-semibold">Customer</TableHead>
                                        <TableHead className="font-semibold">Contact</TableHead>
                                        <TableHead className="font-semibold">Type</TableHead>
                                        <TableHead className="text-center font-semibold">Points</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCustomers.map((customer) => {
                                        const typeConfig = CUSTOMER_TYPE_LABELS[customer.type] || CUSTOMER_TYPE_LABELS.REGULAR;
                                        const Icon = typeConfig.icon;

                                        return (
                                            <TableRow
                                                key={customer.id}
                                                className="cursor-pointer hover:bg-blue-50/50 transition-colors border-gray-100 group"
                                                onClick={() => router.push(`/customers/${customer.id}`)}
                                            >
                                                <TableCell className="pl-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-transform group-hover:scale-105",
                                                            getAvatarColor(customer.name)
                                                        )}>
                                                            {getInitials(customer.name)}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900">{customer.name}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-sm text-gray-700">{customer.phone}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={cn("rounded-full px-2.5 py-0.5 border font-medium", typeConfig.className)} variant="secondary">
                                                        {Icon && <Icon className="w-3 h-3 mr-1" />}
                                                        {typeConfig.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="font-bold text-emerald-700 bg-emerald-50 inline-block px-2 py-0.5 rounded-md border border-emerald-100">
                                                        {customer.points.toLocaleString()}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                        <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between text-xs text-muted-foreground">
                            <span>Page 1 of 1</span>
                            <span>{filteredCustomers.length} records</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
