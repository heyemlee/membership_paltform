'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
import { mockCustomers } from '@/lib/mock-data';
import { Customer, OrderItemBasic } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Plus, Search, Trash2, ShoppingCart } from 'lucide-react';

export default function CreateOrderPage() {
    const router = useRouter();
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [items, setItems] = useState<OrderItemBasic[]>([]);

    // Item Form
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [newItemQty, setNewItemQty] = useState('1');

    // Points
    const [usePoints, setUsePoints] = useState(false);
    const [pointsToRedeem, setPointsToRedeem] = useState('');

    const customer = mockCustomers.find(c => c.id === selectedCustomerId);

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

    const maxPoints = customer?.points || 0;
    const pointsValue = usePoints ? Math.min(parseInt(pointsToRedeem || '0'), maxPoints) * 0.01 : 0; // 1 point = $0.01

    const total = Math.max(0, subtotal - discountAmount - pointsValue);

    const handleSubmit = async () => {
        if (!customer || items.length === 0) return;

        // In real app: POST to API
        await new Promise(resolve => setTimeout(resolve, 1000));

        alert('Order created successfully!');
        router.push('/orders');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <PageHeader
                    title="Create New Order"
                    description="Manually create an order and apply points"
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
                                            {mockCustomers.map(c => (
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
                                    <div className="flex items-center justify-between py-2">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Redeem Points</Label>
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
