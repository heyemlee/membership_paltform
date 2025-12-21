'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { StatusBadge } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { mockCustomers, mockOrders, mockDiscountCodes } from '@/lib/mock-data';
import { Customer, QuickBooksOrder, DiscountCode } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    Tag,
    Coins,
    Calendar,
    ShoppingCart,
    Edit,
    Plus,
    Share2,
    UserCheck,
    Users,
    Repeat
} from 'lucide-react';

const CUSTOMER_TYPE_LABELS: Record<string, { label: string; className: string }> = {
    GC: { label: 'GC', className: 'bg-blue-100 text-blue-800' },
    DESIGNER: { label: 'Designer', className: 'bg-violet-100 text-violet-800' },
    WHOLESALE: { label: 'Wholesale', className: 'bg-amber-100 text-amber-800' },
    REGULAR: { label: 'Regular', className: 'bg-slate-100 text-slate-800' },
    OTHER: { label: 'Other', className: 'bg-gray-100 text-gray-800' },
};

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isCreateCodeDialogOpen, setIsCreateCodeDialogOpen] = useState(false);

    // Edit form state
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editType, setEditType] = useState('');

    // Create code form state
    const [newCodeName, setNewCodeName] = useState('');
    const [newCodeDiscount, setNewCodeDiscount] = useState('5');

    useEffect(() => {
        const timer = setTimeout(() => {
            const found = mockCustomers.find(c => c.id === params.id);
            if (found) {
                setCustomer(found);
                setEditName(found.name);
                setEditEmail(found.email || '');
                setEditPhone(found.phone);
                setEditType(found.type);
            }
            setLoading(false);
        }, 600);

        return () => clearTimeout(timer);
    }, [params.id]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid gap-6 lg:grid-cols-2">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back
                </Button>
                <div className="text-center py-12">
                    <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">Customer not found</p>
                </div>
            </div>
        );
    }

    const typeConfig = CUSTOMER_TYPE_LABELS[customer.type] || CUSTOMER_TYPE_LABELS.REGULAR;

    // Get ALL discount codes for this customer (can have multiple)
    const customerCodes = mockDiscountCodes.filter(c => c.assignedTo?.customerId === customer.id);

    // Get all orders for this customer (own orders)
    const ownOrders = mockOrders.filter(order => order.customerId === customer.id);

    // Get referral orders (orders where others used this customer's discount code)
    const referralOrders = mockOrders.filter(order =>
        order.codeOwnerId === customer.id && order.customerId !== customer.id
    );

    // Combine and sort all orders
    const allOrders = [...ownOrders, ...referralOrders].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const handleSaveEdit = () => {
        if (customer) {
            setCustomer({
                ...customer,
                name: editName,
                email: editEmail,
                phone: editPhone,
                type: editType as Customer['type'],
            });
        }
        setIsEditDialogOpen(false);
        toast({
            title: 'Customer updated',
            description: 'Customer information has been saved successfully.',
        });
    };

    const handleCreateCode = () => {
        if (!newCodeName) return;
        // In real app, this would call API
        toast({
            title: 'Discount code created',
            description: `Code "${newCodeName.toUpperCase()}" has been created for ${customer.name}.`,
        });
        setNewCodeName('');
        setNewCodeDiscount('5');
        setIsCreateCodeDialogOpen(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <PageHeader
                        title={customer.name}
                        description={`Customer ID: ${customer.id}`}
                    />
                </div>
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Customer
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Customer</DialogTitle>
                            <DialogDescription>Update customer information</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={editPhone}
                                    onChange={(e) => setEditPhone(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Customer Type</Label>
                                <Select value={editType} onValueChange={setEditType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="REGULAR">Regular</SelectItem>
                                        <SelectItem value="GC">GC (General Contractor)</SelectItem>
                                        <SelectItem value="DESIGNER">Designer</SelectItem>
                                        <SelectItem value="WHOLESALE">Wholesale</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                                    Cancel
                                </Button>
                                <Button onClick={handleSaveEdit} className="flex-1">
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Customer Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Customer Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Email</span>
                            </div>
                            <span className="font-medium">{customer.email}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Phone</span>
                            </div>
                            <span className="font-medium">{customer.phone}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Tag className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Type</span>
                            </div>
                            <Badge className={typeConfig.className}>{typeConfig.label}</Badge>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Coins className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Points Balance</span>
                            </div>
                            <span className="font-bold text-emerald-600">{customer.points.toLocaleString()}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Discount Rate</span>
                            <span className="font-medium">{customer.discountRate || 0}%</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Member Since</span>
                            </div>
                            <span>{new Date(customer.createdAt).toLocaleDateString()}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Discount Code Workbench - Hidden for Regular Customers */}
                {['GC', 'DESIGNER', 'WHOLESALE'].includes(customer.type) && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Share2 className="h-5 w-5" />
                                    <div>
                                        <CardTitle>Personal Discount Codes</CardTitle>
                                        <CardDescription>Create codes for this customer to share with others</CardDescription>
                                    </div>
                                </div>
                                <Dialog open={isCreateCodeDialogOpen} onOpenChange={setIsCreateCodeDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm">
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add Code
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Create Discount Code</DialogTitle>
                                            <DialogDescription>
                                                Create a personal discount code for {customer.name}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 pt-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="code-name">Code Name</Label>
                                                <Input
                                                    id="code-name"
                                                    placeholder="e.g., JOHNVIP10"
                                                    value={newCodeName}
                                                    onChange={(e) => setNewCodeName(e.target.value.toUpperCase())}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="code-discount">Discount Percentage</Label>
                                                <Select value={newCodeDiscount} onValueChange={setNewCodeDiscount}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="5">5%</SelectItem>
                                                        <SelectItem value="8">8%</SelectItem>
                                                        <SelectItem value="10">10%</SelectItem>
                                                        <SelectItem value="12">12%</SelectItem>
                                                        <SelectItem value="15">15%</SelectItem>
                                                        <SelectItem value="20">20%</SelectItem>
                                                        <SelectItem value="25">25%</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex gap-3 pt-4">
                                                <Button variant="outline" onClick={() => setIsCreateCodeDialogOpen(false)} className="flex-1">
                                                    Cancel
                                                </Button>
                                                <Button onClick={handleCreateCode} disabled={!newCodeName} className="flex-1">
                                                    Create Code
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {customerCodes.length === 0 ? (
                                <div className="text-center py-6">
                                    <Tag className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                                    <p className="text-muted-foreground">No discount codes created yet</p>
                                    <p className="text-sm text-muted-foreground mt-1">Click "Add Code" to create one</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        {customerCodes.map((code) => (
                                            <div key={code.id} className="p-4 rounded-lg bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <Badge className="bg-violet-100 text-violet-800 text-base px-3 py-1">
                                                        {code.code}
                                                    </Badge>
                                                    <span className="font-semibold text-violet-700">{code.discountPercent}% off</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-violet-600">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3.5 w-3.5" />
                                                        {code.uniqueUsersCount} users
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                                            <p className="text-2xl font-bold text-foreground">
                                                {customerCodes.reduce((sum, c) => sum + c.usageCount, 0)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Total Uses</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                                            <p className="text-2xl font-bold text-emerald-600">{referralOrders.length}</p>
                                            <p className="text-xs text-muted-foreground">Referral Orders</p>
                                        </div>
                                    </div>
                                </>
                            )}
                            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                                <p className="text-xs text-emerald-600 mb-1">How it works</p>
                                <p className="text-sm text-emerald-700">
                                    When someone uses one of these codes, both the user and {customer.name.split(' ')[0]} earn the same points!
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Recent Orders */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" />
                            Recent Orders
                        </CardTitle>
                        <CardDescription>
                            Own orders and orders placed by others using this customer&apos;s discount code
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {allOrders.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No orders found for this customer
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {allOrders.map((order) => {
                                    const isReferralOrder = order.codeOwnerId === customer.id && order.customerId !== customer.id;

                                    return (
                                        <div
                                            key={order.id}
                                            className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${isReferralOrder ? 'bg-emerald-50/50 border-emerald-200' : ''
                                                }`}
                                            onClick={() => router.push(`/orders/${order.id}`)}
                                        >
                                            <div className="flex items-center gap-3">
                                                {isReferralOrder && (
                                                    <div className="p-2 rounded-lg bg-emerald-100">
                                                        <UserCheck className="h-4 w-4 text-emerald-600" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">{order.qbInvoiceId}</p>
                                                        {isReferralOrder && (
                                                            <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                                                                Referral
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {isReferralOrder && (
                                                        <p className="text-sm text-muted-foreground">
                                                            Used by <span className="font-medium text-foreground">{order.customerName}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <StatusBadge status={order.status as any} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
