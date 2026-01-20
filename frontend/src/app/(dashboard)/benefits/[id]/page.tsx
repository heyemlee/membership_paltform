'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { api, endpoints } from '@/lib/api';
import { DiscountCode } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Percent, Users, DollarSign, Calendar, Tag, User, ShoppingCart, Clock } from 'lucide-react';

const CUSTOMER_TYPE_LABELS: Record<string, { label: string; className: string }> = {
    GC: { label: 'GC', className: 'bg-blue-100 text-blue-800' },
    DESIGNER: { label: 'Designer', className: 'bg-violet-100 text-violet-800' },
    WHOLESALE: { label: 'Wholesale', className: 'bg-amber-100 text-amber-800' },
    REGULAR: { label: 'Regular', className: 'bg-slate-100 text-slate-800' },
    OTHER: { label: 'Other', className: 'bg-gray-100 text-gray-800' },
};

export default function BenefitDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [code, setCode] = useState<DiscountCode | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCode = async () => {
            try {
                // Fetch all codes and find the one we need
                const data = await api.get<DiscountCode[]>(endpoints.benefits.discountCodes);
                const found = data.find(c => c.id === params.id);
                setCode(found || null);
            } catch (err) {
                console.error('Failed to load discount code:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCode();
    }, [params.id]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid gap-4 md:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-24" />
                    ))}
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!code) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back
                </Button>
                <div className="text-center py-12">
                    <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">Discount code not found</p>
                </div>
            </div>
        );
    }

    // Calculate stats from usage history
    const usageHistory = code.usageHistory || [];
    const totalDiscountGiven = usageHistory.reduce((sum, u) => sum + u.discountAmount, 0);
    const totalOrderValue = usageHistory.reduce((sum, u) => sum + u.orderTotal, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">{code.code}</h1>
                        <Badge className={code.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}>
                            {code.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">
                            {code.type === 'GENERIC' ? 'Promo Code' : 'Exclusive'}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1">{code.description}</p>
                </div>
            </div>

            {/* Assigned To (for exclusive codes) */}
            {code.type === 'EXCLUSIVE' && code.assignedTo && (
                <Card className="border-violet-200 bg-violet-50/50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-violet-100">
                                <User className="h-6 w-6 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-sm text-violet-600 font-medium">Assigned To</p>
                                <p className="text-lg font-semibold text-violet-900">{code.assignedTo.customerName}</p>
                                <Badge className={CUSTOMER_TYPE_LABELS[code.assignedTo.customerType]?.className}>
                                    {CUSTOMER_TYPE_LABELS[code.assignedTo.customerType]?.label}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-100">
                                <Percent className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Discount Rate</p>
                                <p className="text-2xl font-bold">{code.discountPercent}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100">
                                <ShoppingCart className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Times Used</p>
                                <p className="text-2xl font-bold">{code.usageCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-violet-100">
                                <Users className="h-5 w-5 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Unique Users</p>
                                <p className="text-2xl font-bold">{code.uniqueUsersCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-100">
                                <DollarSign className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Order Value</p>
                                <p className="text-2xl font-bold">{formatCurrency(totalOrderValue)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Usage History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Usage History
                    </CardTitle>
                    <CardDescription>See who used this discount code and when</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {usageHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">No usage yet</p>
                            <p className="text-sm text-muted-foreground">This code hasn&apos;t been used in any orders</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Order</TableHead>
                                    <TableHead className="text-right">Order Total</TableHead>
                                    <TableHead className="text-right">Discount</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {usageHistory.map((usage) => {
                                    const typeConfig = CUSTOMER_TYPE_LABELS[usage.customerType] || CUSTOMER_TYPE_LABELS.OTHER;
                                    return (
                                        <TableRow
                                            key={usage.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => router.push(`/customers/${usage.customerId}`)}
                                        >
                                            <TableCell className="font-medium">{usage.customerName}</TableCell>
                                            <TableCell>
                                                <Badge className={typeConfig.className} variant="outline">
                                                    {typeConfig.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">{usage.orderId}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(usage.orderTotal)}</TableCell>
                                            <TableCell className="text-right text-emerald-600 font-medium">
                                                -{formatCurrency(usage.discountAmount)}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(usage.usedAt).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
