'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { api, endpoints } from '@/lib/api';
import {
    CheckCircle,
    RefreshCw,
    Clock,
    FileText,
    Search,
    User,
    Percent,
    Gift,
    Copy,
    Link2,
    Unlink,
    AlertCircle,
    Loader2
} from 'lucide-react';

interface ConnectionStatus {
    isConnected: boolean;
    isConfigured: boolean;
    companyName?: string;
    realmId?: string;
    environment: 'sandbox' | 'production';
    tokenExpiry?: string;
    stats?: {
        totalOrdersSynced: number;
        customersLinked: number;
        lastSyncTime: string | null;
        syncSuccessRate: number;
        pendingErrors: number;
    };
}

interface DiscountResult {
    found: boolean;
    message?: string;
    customer?: {
        id: string;
        name: string;
        phone: string;
        email?: string;
        type: string;
        qbCustomerId?: string;
    };
    discounts?: {
        memberDiscount: number;
        customDiscountCode?: string;
        customDiscountRate?: number;
        availablePoints: number;
        pointsValue: number;
        promoCodes: Array<{
            code: string;
            discountPercent: number;
            description?: string;
            expiresAt?: string;
        }>;
    };
    summary?: string;
}

interface CalculatedDiscount {
    originalAmount: number;
    memberDiscountAmount: number;
    promoDiscountAmount: number;
    pointsDiscountAmount: number;
    totalDiscount: number;
    finalAmount: number;
}

export default function QuickBooksPage() {
    const searchParams = useSearchParams();
    const { toast } = useToast();

    // Connection state
    const [status, setStatus] = useState<ConnectionStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [connecting, setConnecting] = useState(false);

    // Discount helper state
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [discountResult, setDiscountResult] = useState<DiscountResult | null>(null);

    // Calculator state
    const [orderAmount, setOrderAmount] = useState('');
    const [applyMemberDiscount, setApplyMemberDiscount] = useState(true);
    const [applyPromoCode, setApplyPromoCode] = useState(false);
    const [selectedPromoPercent, setSelectedPromoPercent] = useState(0);
    const [redeemPoints, setRedeemPoints] = useState(false);
    const [calculatedDiscount, setCalculatedDiscount] = useState<CalculatedDiscount | null>(null);

    // Load connection status on mount
    useEffect(() => {
        fetchStatus();

        // Check for OAuth callback result
        const success = searchParams.get('success');
        const error = searchParams.get('error');

        if (success === 'true') {
            toast({ title: 'Success', description: 'Connected to QuickBooks successfully!' });
        } else if (error) {
            toast({
                title: 'Connection Failed',
                description: decodeURIComponent(error),
                variant: 'destructive'
            });
        }
    }, [searchParams, toast]);

    const fetchStatus = async () => {
        try {
            setLoading(true);
            const data = await api.get<ConnectionStatus>(endpoints.quickbooks.status);
            setStatus(data);
        } catch (error) {
            console.error('Failed to fetch QuickBooks status:', error);
            setStatus({
                isConnected: false,
                isConfigured: false,
                environment: 'sandbox',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        try {
            setConnecting(true);
            const { url } = await api.get<{ url: string; state: string }>(endpoints.quickbooks.authUrl);
            window.location.href = url;
        } catch (error) {
            console.error('Failed to get auth URL:', error);
            toast({
                title: 'Error',
                description: 'Failed to start QuickBooks connection. Please check configuration.',
                variant: 'destructive'
            });
            setConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            await api.post(endpoints.quickbooks.disconnect, {});
            await fetchStatus();
            toast({ title: 'Disconnected', description: 'QuickBooks has been disconnected.' });
        } catch (error) {
            console.error('Failed to disconnect:', error);
            toast({
                title: 'Error',
                description: 'Failed to disconnect from QuickBooks.',
                variant: 'destructive'
            });
        }
    };

    const handleSync = async (type: 'customers' | 'orders') => {
        try {
            setSyncing(true);
            const endpoint = type === 'customers'
                ? endpoints.quickbooks.syncCustomers
                : endpoints.quickbooks.syncOrders;

            const result = await api.post<{ success: boolean; message: string; syncedCount?: number }>(endpoint, {});

            toast({
                title: result.success ? 'Sync Complete' : 'Sync Failed',
                description: result.message,
                variant: result.success ? 'default' : 'destructive'
            });

            await fetchStatus();
        } catch (error) {
            console.error('Sync failed:', error);
            toast({
                title: 'Sync Failed',
                description: 'An error occurred during synchronization.',
                variant: 'destructive'
            });
        } finally {
            setSyncing(false);
        }
    };

    const handleSearchCustomer = async () => {
        if (!searchQuery || searchQuery.length < 2) {
            toast({
                title: 'Invalid Search',
                description: 'Please enter at least 2 characters.',
                variant: 'destructive'
            });
            return;
        }

        try {
            setSearching(true);
            const result = await api.get<DiscountResult>(
                `${endpoints.quickbooks.discountHelper}?q=${encodeURIComponent(searchQuery)}`
            );
            setDiscountResult(result);

            if (!result.found) {
                toast({
                    title: 'Customer Not Found',
                    description: 'No customer matches your search.',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            console.error('Search failed:', error);
            toast({
                title: 'Search Failed',
                description: 'Failed to search for customer.',
                variant: 'destructive'
            });
        } finally {
            setSearching(false);
        }
    };

    const handleCalculateDiscount = async () => {
        if (!orderAmount || parseFloat(orderAmount) <= 0) {
            toast({
                title: 'Invalid Amount',
                description: 'Please enter a valid order amount.',
                variant: 'destructive'
            });
            return;
        }

        if (!discountResult?.discounts) return;

        try {
            const result = await api.post<CalculatedDiscount>(endpoints.quickbooks.calculateDiscount, {
                orderAmount: parseFloat(orderAmount),
                applyMemberDiscount,
                memberDiscountPercent: applyMemberDiscount ? discountResult.discounts.memberDiscount : 0,
                applyPromoCode,
                promoDiscountPercent: applyPromoCode ? selectedPromoPercent : 0,
                redeemPoints: redeemPoints ? discountResult.discounts.availablePoints : 0,
                pointsRedemptionRate: 0.01, // $0.01 per point
            });

            setCalculatedDiscount(result);
        } catch (error) {
            console.error('Calculation failed:', error);
            toast({
                title: 'Calculation Failed',
                description: 'Failed to calculate discount.',
                variant: 'destructive'
            });
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied', description: 'Copied to clipboard!' });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="QuickBooks Integration"
                    description="Sync orders and invoices with QuickBooks Online"
                />
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="QuickBooks Integration"
                description="Sync orders and invoices with QuickBooks Online"
            />

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Connection Status */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Connection Status</CardTitle>
                            {status?.isConnected ? (
                                <Badge className="bg-emerald-100 text-emerald-800">Connected</Badge>
                            ) : (
                                <Badge variant="secondary">Not Connected</Badge>
                            )}
                        </div>
                        <CardDescription>
                            {status?.isConnected
                                ? `Connected to ${status.companyName || 'QuickBooks Online'}`
                                : status?.isConfigured
                                    ? 'Click connect to link your QuickBooks account'
                                    : 'QuickBooks credentials not configured'
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {status?.isConnected ? (
                            <>
                                <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                                    <div>
                                        <p className="font-medium text-emerald-900">Connected to QuickBooks</p>
                                        <p className="text-sm text-emerald-700">
                                            Environment: {status.environment}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleSync('orders')}
                                        disabled={syncing}
                                        className="flex-1"
                                    >
                                        <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                                        {syncing ? 'Syncing...' : 'Sync Orders'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleDisconnect}
                                    >
                                        <Unlink className="mr-2 h-4 w-4" />
                                        Disconnect
                                    </Button>
                                </div>
                            </>
                        ) : status?.isConfigured ? (
                            <>
                                <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
                                    <AlertCircle className="h-8 w-8 text-amber-600" />
                                    <div>
                                        <p className="font-medium text-amber-900">Not Connected</p>
                                        <p className="text-sm text-amber-700">
                                            Connect to start syncing orders
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleConnect}
                                    disabled={connecting}
                                    className="w-full"
                                >
                                    <Link2 className="mr-2 h-4 w-4" />
                                    {connecting ? 'Connecting...' : 'Connect to QuickBooks'}
                                </Button>
                            </>
                        ) : (
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
                                <AlertCircle className="h-8 w-8 text-gray-400" />
                                <div>
                                    <p className="font-medium text-gray-700">Configuration Required</p>
                                    <p className="text-sm text-gray-500">
                                        Set QUICKBOOKS_CLIENT_ID and QUICKBOOKS_CLIENT_SECRET in .env
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Sync Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sync Settings</CardTitle>
                        <CardDescription>Synchronization statistics</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Auto Sync</span>
                            </div>
                            <Badge className={status?.isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}>
                                {status?.isConnected ? 'Webhook Active' : 'Disabled'}
                            </Badge>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Last Sync</span>
                            <span className="font-medium">
                                {status?.stats?.lastSyncTime
                                    ? new Date(status.stats.lastSyncTime).toLocaleString()
                                    : 'Never'
                                }
                            </span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Total Orders Synced</span>
                            <span className="font-medium">{status?.stats?.totalOrdersSynced || 0}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Customers Linked</span>
                            <span className="font-medium">{status?.stats?.customersLinked || 0}</span>
                        </div>
                        {status?.isConnected && (
                            <Button
                                variant="outline"
                                onClick={() => handleSync('customers')}
                                disabled={syncing}
                                className="w-full"
                            >
                                <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                                Sync Customers
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Discount Helper */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            <CardTitle>Discount Helper</CardTitle>
                        </div>
                        <CardDescription>
                            Look up customer discounts before creating orders in QuickBooks
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Search Section */}
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Enter phone, email, or name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearchCustomer()}
                                    />
                                    <Button onClick={handleSearchCustomer} disabled={searching}>
                                        {searching ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Search className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>

                                {discountResult?.found && discountResult.customer && (
                                    <div className="space-y-4">
                                        {/* Customer Info */}
                                        <div className="p-4 rounded-lg border bg-muted/30">
                                            <div className="flex items-center gap-3 mb-3">
                                                <User className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium">{discountResult.customer.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {discountResult.customer.type} • {discountResult.customer.phone}
                                                    </p>
                                                </div>
                                                <Badge className="ml-auto">{discountResult.customer.type}</Badge>
                                            </div>
                                        </div>

                                        {/* Available Discounts */}
                                        {discountResult.discounts && (
                                            <div className="space-y-3">
                                                <h4 className="font-medium flex items-center gap-2">
                                                    <Percent className="h-4 w-4" />
                                                    Available Discounts
                                                </h4>

                                                {discountResult.discounts.memberDiscount > 0 && (
                                                    <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                                                        <span className="text-emerald-800">Member Discount</span>
                                                        <span className="font-bold text-emerald-800">
                                                            {discountResult.discounts.memberDiscount}% off
                                                        </span>
                                                    </div>
                                                )}

                                                {discountResult.discounts.customDiscountCode && (
                                                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                                                        <div>
                                                            <span className="text-blue-800">Personal Code: </span>
                                                            <code className="font-mono font-bold">
                                                                {discountResult.discounts.customDiscountCode}
                                                            </code>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-blue-800">
                                                                {discountResult.discounts.customDiscountRate}% off
                                                            </span>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => copyToClipboard(discountResult.discounts!.customDiscountCode!)}
                                                            >
                                                                <Copy className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}

                                                {discountResult.discounts.availablePoints > 0 && (
                                                    <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-200">
                                                        <div className="flex items-center gap-2">
                                                            <Gift className="h-4 w-4 text-purple-600" />
                                                            <span className="text-purple-800">Points Balance</span>
                                                        </div>
                                                        <span className="font-bold text-purple-800">
                                                            {discountResult.discounts.availablePoints.toLocaleString()} pts
                                                            ({formatCurrency(discountResult.discounts.pointsValue)})
                                                        </span>
                                                    </div>
                                                )}

                                                {discountResult.discounts.promoCodes.length > 0 && (
                                                    <div className="space-y-2">
                                                        <span className="text-sm text-muted-foreground">Promo Codes:</span>
                                                        {discountResult.discounts.promoCodes.map((promo) => (
                                                            <div
                                                                key={promo.code}
                                                                className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200"
                                                            >
                                                                <div>
                                                                    <code className="font-mono font-bold">{promo.code}</code>
                                                                    {promo.description && (
                                                                        <p className="text-xs text-amber-700">{promo.description}</p>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-amber-800">
                                                                        {promo.discountPercent}% off
                                                                    </span>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => copyToClipboard(promo.code)}
                                                                    >
                                                                        <Copy className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Calculator Section */}
                            <div className="space-y-4">
                                <h4 className="font-medium">Discount Calculator</h4>

                                <div className="space-y-2">
                                    <Label htmlFor="orderAmount">Order Amount</Label>
                                    <div className="flex gap-2">
                                        <span className="flex items-center px-3 bg-muted border rounded-l-md">$</span>
                                        <Input
                                            id="orderAmount"
                                            type="number"
                                            placeholder="0.00"
                                            value={orderAmount}
                                            onChange={(e) => setOrderAmount(e.target.value)}
                                            className="rounded-l-none"
                                        />
                                    </div>
                                </div>

                                {discountResult?.found && discountResult.discounts && (
                                    <div className="space-y-3">
                                        {discountResult.discounts.memberDiscount > 0 && (
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id="memberDiscount"
                                                    checked={applyMemberDiscount}
                                                    onCheckedChange={(checked) => setApplyMemberDiscount(checked as boolean)}
                                                />
                                                <Label htmlFor="memberDiscount" className="cursor-pointer">
                                                    Apply {discountResult.discounts.memberDiscount}% Member Discount
                                                </Label>
                                            </div>
                                        )}

                                        {discountResult.discounts.promoCodes.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        id="promoCode"
                                                        checked={applyPromoCode}
                                                        onCheckedChange={(checked) => {
                                                            setApplyPromoCode(checked as boolean);
                                                            if (checked && discountResult.discounts!.promoCodes.length > 0) {
                                                                setSelectedPromoPercent(discountResult.discounts!.promoCodes[0].discountPercent);
                                                            }
                                                        }}
                                                    />
                                                    <Label htmlFor="promoCode" className="cursor-pointer">
                                                        Apply Promo Code
                                                    </Label>
                                                </div>
                                                {applyPromoCode && (
                                                    <select
                                                        className="w-full p-2 border rounded-md"
                                                        value={selectedPromoPercent}
                                                        onChange={(e) => setSelectedPromoPercent(Number(e.target.value))}
                                                    >
                                                        {discountResult.discounts.promoCodes.map((promo) => (
                                                            <option key={promo.code} value={promo.discountPercent}>
                                                                {promo.code} ({promo.discountPercent}% off)
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        )}

                                        {discountResult.discounts.availablePoints > 0 && (
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id="redeemPoints"
                                                    checked={redeemPoints}
                                                    onCheckedChange={(checked) => setRedeemPoints(checked as boolean)}
                                                />
                                                <Label htmlFor="redeemPoints" className="cursor-pointer">
                                                    Redeem {discountResult.discounts.availablePoints.toLocaleString()} points
                                                    ({formatCurrency(discountResult.discounts.pointsValue)})
                                                </Label>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <Button
                                    onClick={handleCalculateDiscount}
                                    className="w-full"
                                    disabled={!orderAmount || !discountResult?.found}
                                >
                                    Calculate Final Price
                                </Button>

                                {calculatedDiscount && (
                                    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Original Amount</span>
                                            <span>{formatCurrency(calculatedDiscount.originalAmount)}</span>
                                        </div>
                                        {calculatedDiscount.memberDiscountAmount > 0 && (
                                            <div className="flex justify-between text-sm text-emerald-600">
                                                <span>Member Discount</span>
                                                <span>-{formatCurrency(calculatedDiscount.memberDiscountAmount)}</span>
                                            </div>
                                        )}
                                        {calculatedDiscount.promoDiscountAmount > 0 && (
                                            <div className="flex justify-between text-sm text-blue-600">
                                                <span>Promo Discount</span>
                                                <span>-{formatCurrency(calculatedDiscount.promoDiscountAmount)}</span>
                                            </div>
                                        )}
                                        {calculatedDiscount.pointsDiscountAmount > 0 && (
                                            <div className="flex justify-between text-sm text-purple-600">
                                                <span>Points Redemption</span>
                                                <span>-{formatCurrency(calculatedDiscount.pointsDiscountAmount)}</span>
                                            </div>
                                        )}
                                        <Separator />
                                        <div className="flex justify-between font-bold text-lg">
                                            <span>Final Amount</span>
                                            <span className="text-emerald-600">
                                                {formatCurrency(calculatedDiscount.finalAmount)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground text-center">
                                            Total Savings: {formatCurrency(calculatedDiscount.totalDiscount)}
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => copyToClipboard(
                                                `Customer: ${discountResult?.customer?.name}\n` +
                                                `Original: ${formatCurrency(calculatedDiscount.originalAmount)}\n` +
                                                `Discount: ${formatCurrency(calculatedDiscount.totalDiscount)}\n` +
                                                `Final: ${formatCurrency(calculatedDiscount.finalAmount)}`
                                            )}
                                        >
                                            <Copy className="mr-2 h-3 w-3" />
                                            Copy Summary
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sync Statistics */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            <CardTitle>Sync Statistics</CardTitle>
                        </div>
                        <CardDescription>Overview of data synchronization</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="p-4 rounded-lg bg-muted/50 text-center">
                                <p className="text-3xl font-bold text-foreground">
                                    {status?.stats?.totalOrdersSynced?.toLocaleString() || 0}
                                </p>
                                <p className="text-sm text-muted-foreground">Total Orders Synced</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50 text-center">
                                <p className="text-3xl font-bold text-foreground">
                                    {status?.stats?.customersLinked || 0}
                                </p>
                                <p className="text-sm text-muted-foreground">Customers Linked</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50 text-center">
                                <p className="text-3xl font-bold text-emerald-600">
                                    {status?.stats?.syncSuccessRate?.toFixed(1) || 100}%
                                </p>
                                <p className="text-sm text-muted-foreground">Sync Success Rate</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50 text-center">
                                <p className="text-3xl font-bold text-foreground">
                                    {status?.stats?.pendingErrors || 0}
                                </p>
                                <p className="text-sm text-muted-foreground">Pending Errors</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
