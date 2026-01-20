'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout';
import { StatsCard } from '@/components/common';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { api, endpoints } from '@/lib/api';
import { DashboardStats } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, Users, ShoppingCart, Clock, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await api.get<DashboardStats>(endpoints.dashboard.stats);
                setStats(data);
            } catch (err) {
                setError('Failed to load dashboard stats');
                console.error('Dashboard error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <PageHeader title="Dashboard" description="Overview of your business metrics and recent activity." />
                <div className="grid gap-6 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                    <Skeleton className="h-96 w-full rounded-xl" />
                    <Skeleton className="h-96 w-full rounded-xl" />
                </div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="space-y-8">
                <PageHeader title="Dashboard" description="Overview of your business metrics and recent activity." />
                <Card className="p-8 text-center">
                    <p className="text-muted-foreground">{error || 'Failed to load dashboard data'}</p>
                    <Button className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-end">
                <PageHeader
                    title="Dashboard"
                    description="Overview of your business metrics and recent activity."
                />
                <div className="hidden md:block">
                    <Button variant="outline" className="gap-2">
                        <Clock className="w-4 h-4" />
                        Last 30 Days
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                <StatsCard
                    title="Total Revenue"
                    value={formatCurrency(stats.totalRevenue)}
                    change={stats.revenueChange}
                    icon={DollarSign}
                    delay="0ms"
                />
                <StatsCard
                    title="Total Customers"
                    value={stats.activeCustomers.toLocaleString()}
                    change={stats.customersChange}
                    icon={Users}
                    delay="100ms"
                />
                <StatsCard
                    title="Total Orders"
                    value={stats.totalOrders.toLocaleString()}
                    change={stats.ordersChange}
                    icon={ShoppingCart}
                    delay="200ms"
                />
            </div>

            {/* Recent Orders & Top Customers */}
            <div className="grid gap-6 lg:grid-cols-2 delay-500 animate-in fade-in slide-in-from-bottom-8 fill-mode-both" style={{ animationDelay: '400ms' }}>
                {/* Recent Orders */}
                <Card className="border-border/50 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div className="space-y-1">
                            <CardTitle>Recent Orders</CardTitle>
                            <CardDescription>Latest orders from your customers</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild>
                            <Link href="/orders">
                                View all <ArrowUpRight className="h-3 w-3" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {stats.recentOrders.map((order) => (
                                    <div key={order.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-medium text-xs">
                                                {order.customerName.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{order.customerName}</p>
                                                <p className="text-xs text-muted-foreground">{order.qbInvoiceId}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-sm text-foreground">{formatCurrency(order.total)}</p>
                                            <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Customers */}
                <Card className="border-border/50 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div className="space-y-1">
                            <CardTitle>Top Customers</CardTitle>
                            <CardDescription>Highest spending customers</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild>
                            <Link href="/customers">
                                View all <ArrowUpRight className="h-3 w-3" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {stats.topCustomers.map((customer, i) => (
                                    <div key={customer.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${i === 0 ? 'bg-amber-100 text-amber-700' :
                                                i === 1 ? 'bg-zinc-100 text-zinc-700' :
                                                    i === 2 ? 'bg-orange-100 text-orange-700' :
                                                        'bg-muted text-muted-foreground'
                                                }`}>
                                                {i + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{customer.name}</p>
                                                <p className="text-xs text-muted-foreground">{customer.orderCount} orders</p>
                                            </div>
                                        </div>
                                        <p className="font-medium text-sm text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{formatCurrency(customer.totalSpent)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

