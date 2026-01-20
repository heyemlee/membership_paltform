'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { api, endpoints } from '@/lib/api';
import { Customer, OrderItemBasic, CustomerCredit } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Plus, Trash2, ShoppingCart, Coins, DollarSign, Clock } from 'lucide-react';

interface CustomersResponse {
    data: Customer[];
    meta: { total: number; page: number; limit: number; totalPages: number };
}

export default function CreateOrderPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [items, setItems] = useState<OrderItemBasic[]>([]);

    // Item Form
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [newItemQty, setNewItemQty] = useState('1');

    // Points
    const [usePoints, setUsePoints] = useState(false);
    const [pointsToRedeem, setPointsToRedeem] = useState('');

    // Credits
    const [customerCredits, setCustomerCredits] = useState<CustomerCredit[]>([]);
    const [selectedCreditId, setSelectedCreditId] = useState<string | null>(null);
    const [loadingCredits, setLoadingCredits] = useState(false);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await api.get<CustomersResponse>(`${endpoints.customers.list}?limit=100`);
                setCustomers(response.data);
            } catch (err) {
                console.error('Failed to load customers:', err);
            }
        };
        fetchCustomers();
    }, []);

    // Fetch credits when customer changes
    useEffect(() => {
        if (selectedCustomerId) {
            setLoadingCredits(true);
            setSelectedCreditId(null);
            api.get<CustomerCredit[]>(`${endpoints.credits.customerCredits(selectedCustomerId)}?available=true`)
                .then(data => setCustomerCredits(data))
                .catch(err => {
                    console.error('Failed to load customer credits:', err);
                    setCustomerCredits([]);
                })
                .finally(() => setLoadingCredits(false));
        } else {
            setCustomerCredits([]);
            setSelectedCreditId(null);
        }
    }, [selectedCustomerId]);

    const customer = customers.find(c => c.id === selectedCustomerId);

    const handleAddItem = () => {
        if (!newItemName || !newItemPrice) return;
        const price = parseFloat(newItemPrice);
        const qty = parseInt(newItemQty);

        const newItem: OrderItemBasic = {
            sku: `sku-${Date.now()}`,
            name: newItemName,
            quantity: qty,
            unitPrice: price,
            amount: price * qty,
        };

        setItems([...items, newItem]);
        setNewItemName('');
        setNewItemPrice('');
        setNewItemQty('1');
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    // Calculations
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const discountRate = customer?.discountRate || 0;
    const discountAmount = subtotal * (discountRate / 100);
    const afterDiscount = subtotal - discountAmount;

    // Points
    const maxPoints = customer?.points || 0;
    const pointsValue = usePoints ? Math.min(parseInt(pointsToRedeem || '0'), maxPoints) * 0.01 : 0;

    // Credits
    const selectedCredit = customerCredits.find(c => c.id === selectedCreditId);
    const creditValue = selectedCredit ? selectedCredit.amount : 0;
    const canUseCredit = selectedCredit ? afterDiscount >= selectedCredit.minOrderAmount : false;

    const total = Math.max(0, afterDiscount - pointsValue - (canUseCredit ? creditValue : 0));

    const handleSubmit = async () => {
        if (!customer || items.length === 0) return;

        try {
            // Create the order
            const orderResponse = await api.post<{ id: string }>(endpoints.orders.create, {
                customerId: customer.id,
                customerName: customer.name,
                items: items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                })),
                pointsToRedeem: usePoints ? parseInt(pointsToRedeem || '0') : 0,
            });

            // If a credit was selected and can be used, mark it as used
            if (selectedCreditId && canUseCredit && orderResponse.id) {
                try {
                    await api.post(endpoints.credits.use(selectedCreditId), {
                        orderId: orderResponse.id,
                        orderTotal: afterDiscount,
                    });
                } catch (creditError) {
                    console.error('Failed to apply credit:', creditError);
                    // Order was still created, just credit wasn't applied
                }
            }

            alert('Order created successfully!');
            router.push('/orders');
        } catch (error) {
            console.error('Failed to create order:', error);
            alert('Failed to create order. Please try again.');
        }
    };

    // Get available credits (active, not used, not expired, and meets min order)
    const availableCredits = customerCredits.filter(credit => {
        const isExpired = credit.expiresAt && new Date(credit.expiresAt) < new Date();
        return credit.isActive && !credit.isUsed && !isExpired;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <PageHeader
                    title="Create New Order"
                    description="Manually create an order and apply points or credits"
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer</CardTitle>
                            <CardDescription>Select a customer for this order</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Search or select customer..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.map(c => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.name} ({c.type}) - {c.phone}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {customer && (
                                <div className="mt-4 p-4 rounded-lg bg-muted flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">{customer.name}</p>
                                        <p className="text-sm text-muted-foreground">{customer.email}</p>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                                {customer.type}
                                            </span>
                                            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                                                {customer.discountRate}% Discount
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Available Points</p>
                                        <p className="font-bold text-lg text-amber-600">{customer.points.toLocaleString()}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Items</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-6 items-end">
                                <div className="md:col-span-3 space-y-2">
                                    <Label>Item Name</Label>
                                    <Input
                                        value={newItemName}
                                        onChange={(e) => setNewItemName(e.target.value)}
                                        placeholder="Product name"
                                    />
                                </div>
                                <div className="md:col-span-1 space-y-2">
                                    <Label>Qty</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={newItemQty}
                                        onChange={(e) => setNewItemQty(e.target.value)}
                                    />
                                </div>
                                <div className="md:col-span-1 space-y-2">
                                    <Label>Price</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={newItemPrice}
                                        onChange={(e) => setNewItemPrice(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                                <Button onClick={handleAddItem} disabled={!newItemName || !newItemPrice}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            {items.length > 0 && (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead className="text-center">Qty</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell className="text-center">{item.quantity}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(index)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    {/* Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>

                            {customer && customer.discountRate > 0 && (
                                <div className="flex justify-between text-sm text-emerald-600">
                                    <span>Discount ({customer.discountRate}%)</span>
                                    <span>- {formatCurrency(discountAmount)}</span>
                                </div>
                            )}

                            {customer && (
                                <>
                                    <Separator />

                                    {/* Points Section */}
                                    <div className="flex items-center justify-between py-2">
                                        <div className="space-y-0.5">
                                            <Label className="text-base flex items-center gap-2">
                                                <Coins className="h-4 w-4 text-amber-500" />
                                                Redeem Points
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                Max: {customer.points} (${(customer.points * 0.01).toFixed(2)})
                                            </p>
                                        </div>
                                        <Switch
                                            checked={usePoints}
                                            onCheckedChange={setUsePoints}
                                            disabled={customer.points === 0}
                                        />
                                    </div>
                                    {usePoints && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    value={pointsToRedeem}
                                                    onChange={(e) => setPointsToRedeem(e.target.value)}
                                                    max={customer.points}
                                                    placeholder="Points to use"
                                                />
                                            </div>
                                            <p className="text-sm text-right text-emerald-600">
                                                - {formatCurrency(Math.min(parseInt(pointsToRedeem || '0'), customer.points) * 0.01)}
                                            </p>
                                        </div>
                                    )}

                                    {/* Credits Section */}
                                    <Separator />
                                    <div className="space-y-3">
                                        <Label className="text-base flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-emerald-500" />
                                            Use Credit Voucher
                                        </Label>

                                        {loadingCredits ? (
                                            <p className="text-sm text-muted-foreground">Loading credits...</p>
                                        ) : availableCredits.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">No credits available</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {availableCredits.map((credit) => {
                                                    const meetsMinOrder = afterDiscount >= credit.minOrderAmount;
                                                    const isSelected = selectedCreditId === credit.id;

                                                    return (
                                                        <div
                                                            key={credit.id}
                                                            className={`p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                                                                    ? 'border-emerald-500 bg-emerald-50'
                                                                    : meetsMinOrder
                                                                        ? 'border-gray-200 hover:border-emerald-300'
                                                                        : 'border-gray-200 bg-gray-50 opacity-60'
                                                                }`}
                                                            onClick={() => {
                                                                if (meetsMinOrder) {
                                                                    setSelectedCreditId(isSelected ? null : credit.id);
                                                                }
                                                            }}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <Checkbox
                                                                        checked={isSelected}
                                                                        disabled={!meetsMinOrder}
                                                                        className="pointer-events-none"
                                                                    />
                                                                    <div>
                                                                        <Badge className="bg-emerald-100 text-emerald-700">
                                                                            ${credit.amount.toFixed(2)} off
                                                                        </Badge>
                                                                        <p className="text-xs text-muted-foreground mt-1">
                                                                            {credit.name}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className={`text-xs ${meetsMinOrder ? 'text-emerald-600' : 'text-orange-500'}`}>
                                                                        Min. ${credit.minOrderAmount}
                                                                    </p>
                                                                    {credit.expiresAt && (
                                                                        <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                                                                            <Clock className="h-3 w-3" />
                                                                            {new Date(credit.expiresAt).toLocaleDateString()}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {!meetsMinOrder && (
                                                                <p className="text-xs text-orange-500 mt-2">
                                                                    Order must be at least ${credit.minOrderAmount} to use this credit
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {selectedCredit && canUseCredit && (
                                            <p className="text-sm text-right text-emerald-600">
                                                - {formatCurrency(creditValue)}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}

                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>{formatCurrency(total)}</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handleSubmit}
                                disabled={items.length === 0 || !customer}
                            >
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Place Order
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
