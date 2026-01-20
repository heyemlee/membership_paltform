'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { QuickBooksOrder } from '@/types';
import { api, endpoints } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
    Search,
    ShoppingBag,
    RefreshCw,
    Plus,
    DollarSign,
    Clock,
    CheckCircle2,
    XCircle,
    MoreHorizontal,
    FileText,
    ArrowUpRight,
    Filter,
    Download,
    ArrowUpDown,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrdersResponse {
    data: QuickBooksOrder[];
    meta: { total: number; page: number; limit: number; totalPages: number };
}

type SortField = 'date' | 'amount' | null;
type SortDirection = 'asc' | 'desc';

export default function OrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<QuickBooksOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await api.get<OrdersResponse>(`${endpoints.orders.list}?limit=100`);
                setOrders(response.data);
            } catch (err) {
                console.error('Failed to load orders:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const filteredOrders = useMemo(() => {
        return orders.filter(order =>
            order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.qbInvoiceId.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [orders, searchQuery]);

    const sortedOrders = useMemo(() => {
        if (!sortField) return filteredOrders;

        return [...filteredOrders].sort((a, b) => {
            if (sortField === 'date') {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
            } else if (sortField === 'amount') {
                return sortDirection === 'asc' ? a.total - b.total : b.total - a.total;
            }
            return 0;
        });
    }, [filteredOrders, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            if (sortDirection === 'desc') {
                setSortDirection('asc');
            } else {
                setSortField(null);
            }
        } else {
            setSortField(field);
            setSortDirection('desc'); // Default to desc (newest/highest first)
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
        }
        return sortDirection === 'desc'
            ? <ArrowDown className="h-4 w-4 text-primary" />
            : <ArrowUp className="h-4 w-4 text-primary" />;
    };

    // Calculate Stats
    const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
    const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return {
                    label: 'Completed',
                    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                    icon: CheckCircle2
                };
            case 'PENDING':
                return {
                    label: 'Pending',
                    className: 'bg-amber-100 text-amber-700 border-amber-200',
                    icon: Clock
                };
            case 'CANCELLED':
                return {
                    label: 'Cancelled',
                    className: 'bg-red-100 text-red-700 border-red-200',
                    icon: XCircle
                };
            default:
                return {
                    label: status,
                    className: 'bg-gray-100 text-gray-700 border-gray-200',
                    icon: FileText
                };
        }
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map((i) => (
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
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Orders</h1>
                        <p className="text-muted-foreground mt-1">
                            Track and manage your customer orders and invoices.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="bg-white hover:bg-gray-50 shadow-sm border-gray-200"
                            onClick={() => { }}
                        >
                            <RefreshCw className="mr-2 h-4 w-4 text-muted-foreground" />
                            Sync QuickBooks
                        </Button>
                        <Button
                            size="lg"
                            onClick={() => router.push('/orders/create')}
                            className="bg-black hover:bg-gray-800 text-white shadow-lg shadow-black/10 transition-all hover:shadow-black/20 hover:-translate-y-0.5 rounded-full px-6"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Create Order
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-none shadow-md bg-white/60 backdrop-blur-xl hover:bg-white/80 transition-all duration-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between space-y-0 pb-2">
                                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                                <span className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                                    <DollarSign className="h-4 w-4" />
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2 mt-2">
                                <h2 className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</h2>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">All time revenue</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md bg-white/60 backdrop-blur-xl hover:bg-white/80 transition-all duration-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between space-y-0 pb-2">
                                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                                <span className="bg-blue-100 p-2 rounded-full text-blue-600">
                                    <ShoppingBag className="h-4 w-4" />
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2 mt-2">
                                <h2 className="text-2xl font-bold text-gray-900">{orders.length}</h2>
                                <span className="text-xs font-medium text-emerald-600 flex items-center bg-emerald-50 px-1.5 py-0.5 rounded-md">
                                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                                    +12%
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">vs. last month</p>
                        </CardContent>
                    </Card>

                </div>

                {/* Main Content */}
                <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden rounded-2xl">
                    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search orders, customers, or invoices..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white transition-all rounded-xl"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-9 border-dashed">
                                <Filter className="mr-2 h-4 w-4" />
                                Filter
                            </Button>
                            <Button variant="outline" size="sm" className="h-9 border-dashed">
                                <Download className="mr-2 h-4 w-4" />
                                Export
                            </Button>
                        </div>
                    </div>

                    <CardContent className="p-0">
                        {sortedOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="bg-gray-50 p-4 rounded-full mb-4">
                                    <ShoppingBag className="h-8 w-8 text-muted-foreground opacity-50" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">No orders found</h3>
                                <p className="text-muted-foreground max-w-sm mt-2">
                                    We couldn't find any orders matching your search.
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-gray-100 bg-gray-50/50">
                                        <TableHead className="pl-6 h-12 font-semibold">Invoice ID</TableHead>
                                        <TableHead className="font-semibold">Customer</TableHead>
                                        <TableHead
                                            className="font-semibold cursor-pointer hover:bg-muted/50 select-none"
                                            onClick={() => handleSort('date')}
                                        >
                                            <div className="flex items-center gap-2">
                                                Date
                                                {getSortIcon('date')}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="font-semibold cursor-pointer hover:bg-muted/50 select-none"
                                            onClick={() => handleSort('amount')}
                                        >
                                            <div className="flex items-center gap-2">
                                                Amount
                                                {getSortIcon('amount')}
                                            </div>
                                        </TableHead>
                                        <TableHead className="font-semibold text-center">Status</TableHead>
                                        <TableHead className="font-semibold text-center hidden md:table-cell">Sync</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedOrders.map((order) => {
                                        const statusConfig = getStatusConfig(order.status as string);
                                        const StatusIcon = statusConfig.icon;

                                        return (
                                            <TableRow
                                                key={order.id}
                                                className="cursor-pointer hover:bg-blue-50/50 transition-colors border-gray-100 group"
                                                onClick={() => router.push(`/orders/${order.id}`)}
                                            >
                                                <TableCell className="pl-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium text-gray-900">{order.qbInvoiceId}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-gray-700">{order.customerName}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-muted-foreground text-sm">
                                                        {new Date(order.createdAt).toLocaleDateString(undefined, {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-semibold text-gray-900">
                                                        {formatCurrency(order.total)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className={cn("rounded-full px-2.5 py-0.5 border font-medium", statusConfig.className)} variant="secondary">
                                                        {StatusIcon && <StatusIcon className="w-3 h-3 mr-1.5" />}
                                                        {statusConfig.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center hidden md:table-cell">
                                                    <div className={cn(
                                                        "inline-flex items-center justify-center p-1 rounded-full",
                                                        order.syncStatus === 'SYNCED' ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"
                                                    )}>
                                                        {order.syncStatus === 'SYNCED' ? (
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        ) : (
                                                            <Clock className="h-4 w-4" />
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <span className="sr-only">Open menu</span>
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuItem onClick={() => router.push(`/orders/${order.id}`)}>
                                                                    View Details
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem>
                                                                    Download Invoice
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem className="text-red-600">
                                                                    Cancel Order
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                        <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between text-xs text-muted-foreground">
                            <span>Showing {sortedOrders.length} orders</span>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="h-8 text-xs" disabled>Previous</Button>
                                <Button variant="outline" size="sm" className="h-8 text-xs" disabled>Next</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
