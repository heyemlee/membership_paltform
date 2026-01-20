'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { StatusBadge } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { api, endpoints } from '@/lib/api';
import { QuickBooksOrder } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Calendar, User, Hash, Tag } from 'lucide-react';

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<QuickBooksOrder | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const data = await api.get<QuickBooksOrder>(endpoints.orders.detail(params.id as string));
                setOrder(data);
            } catch (err) {
                console.error('Failed to load order:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [params.id]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back
                </Button>
                <Card className="p-8 text-center">
                    <p className="text-muted-foreground">Order not found</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <PageHeader
                    title={`Order ${order.qbInvoiceId}`}
                    description={`Order ID: ${order.id}`}
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Order Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Order Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Customer</span>
                            </div>
                            <span className="font-medium">{order.customerName}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Hash className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">QB Invoice</span>
                            </div>
                            <span className="font-mono">{order.qbInvoiceId}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Date</span>
                            </div>
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <StatusBadge status={order.status as any} />
                        </div>
                        {order.discountCode && (
                            <>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Tag className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Discount Code</span>
                                    </div>
                                    <Badge className="bg-violet-100 text-violet-800">{order.discountCode}</Badge>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Order Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 rounded-lg bg-muted">
                            <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                            <p className="text-3xl font-bold text-foreground">{formatCurrency(order.total)}</p>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Sync Status</span>
                            <Badge variant={order.syncStatus === 'SYNCED' ? 'default' : 'outline'}>
                                {order.syncStatus}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
