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
import { PhoneInput } from '@/components/ui/phone-input';
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
import { api, endpoints } from '@/lib/api';
import { Customer, QuickBooksOrder, DiscountCode, AssignedPromoCode, CustomerCredit } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { IssueCreditDialog } from '@/components/common/issue-credit-dialog';
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
    Repeat,
    Ticket,
    Trash2,
    Check,
    Clock,
    Gift,
    DollarSign
} from 'lucide-react';

const CUSTOMER_TYPE_LABELS: Record<string, { label: string; className: string }> = {
    GC: { label: 'GC', className: 'bg-blue-100 text-blue-800' },
    DESIGNER: { label: 'Designer', className: 'bg-violet-100 text-violet-800' },
    WHOLESALE: { label: 'Wholesale', className: 'bg-amber-100 text-amber-800' },
    REGULAR: { label: 'Regular', className: 'bg-slate-100 text-slate-800' },
    OTHER: { label: 'Other', className: 'bg-gray-100 text-gray-800' },
};

interface CustomerDetailResponse extends Customer {
    orders?: Array<{
        id: string;
        customerId: string;
        customerName?: string;
        qbInvoiceId?: string;
        total: number;
        status: string;
        createdAt: string;
        codeOwnerId?: string;
        items?: Array<{ id: string; name: string; quantity: number; price: number }>;
    }>;
    pointsHistory?: Array<{
        id: string;
        customerId: string;
        amount: number;
        type: string;
        description: string;
        createdAt: string;
    }>;
    discountCodes?: DiscountCode[];
    assignedPromoCodes?: AssignedPromoCode[];
}

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [customer, setCustomer] = useState<CustomerDetailResponse | null>(null);
    const [credits, setCredits] = useState<CustomerCredit[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isCreateCodeDialogOpen, setIsCreateCodeDialogOpen] = useState(false);
    const [isAddPromoCodeDialogOpen, setIsAddPromoCodeDialogOpen] = useState(false);
    const [isIssueCreditDialogOpen, setIsIssueCreditDialogOpen] = useState(false);

    // Edit form state
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editType, setEditType] = useState('');

    // Create code form state (for GC/Designer/Wholesale to create codes for sharing)
    const [newCodeName, setNewCodeName] = useState('');
    const [newCodeDiscount, setNewCodeDiscount] = useState('5');

    // Add promo code form state (for assigning existing promo codes to a customer)
    const [promoCodeToAdd, setPromoCodeToAdd] = useState('');

    const fetchCustomerData = async () => {
        try {
            const [customerData, creditsData] = await Promise.all([
                api.get<CustomerDetailResponse>(endpoints.customers.detail(params.id as string)),
                api.get<CustomerCredit[]>(endpoints.credits.customerCredits(params.id as string))
            ]);

            setCustomer(customerData);
            setCredits(creditsData);
            setEditName(customerData.name);
            setEditEmail(customerData.email || '');
            setEditPhone(customerData.phone);
            setEditType(customerData.type);
        } catch (err) {
            console.error('Failed to load customer data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomerData();
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

    // Get discount codes from customer detail response
    const customerCodes = customer.discountCodes || [];

    // Get orders from customer detail response (already includes related orders)
    const allOrders = customer.orders || [];

    // Calculate referral orders (orders where codeOwnerId matches - need to filter if available)
    const referralOrders = allOrders.filter(order =>
        (order as any).codeOwnerId === customer.id && order.customerId !== customer.id
    );

    const handleSaveEdit = async () => {
        if (!customer) return;

        try {
            await api.put(endpoints.customers.update(customer.id), {
                name: editName,
                email: editEmail || null,
                phone: editPhone,
                type: editType,
            });

            setCustomer({
                ...customer,
                name: editName,
                email: editEmail,
                phone: editPhone,
                type: editType as Customer['type'],
            });
            setIsEditDialogOpen(false);
            toast({
                title: 'Customer updated',
                description: 'Customer information has been saved successfully.',
            });
        } catch (error) {
            console.error('Failed to update customer:', error);
            toast({
                title: 'Error',
                description: 'Failed to update customer. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handleCreateCode = async () => {
        if (!newCodeName || !customer) return;

        try {
            const newCode = await api.post<DiscountCode>(endpoints.benefits.discountCodes, {
                code: newCodeName.toUpperCase(),
                type: 'EXCLUSIVE',
                description: `Personal discount code for ${customer.name}`,
                discountPercent: Number(newCodeDiscount),
                isActive: true,
                customerId: customer.id,
            });

            // Update local state with new code
            setCustomer({
                ...customer,
                discountCodes: [...(customer.discountCodes || []), newCode],
            });

            toast({
                title: 'Discount code created',
                description: `Code "${newCodeName.toUpperCase()}" has been created for ${customer.name}.`,
            });
            setNewCodeName('');
            setNewCodeDiscount('5');
            setIsCreateCodeDialogOpen(false);
        } catch (error) {
            console.error('Failed to create discount code:', error);
            toast({
                title: 'Error',
                description: 'Failed to create discount code. Please try again.',
                variant: 'destructive',
            });
        }
    };

    // Handle adding a promo code to the customer (assign existing code for checkout use)
    const handleAddPromoCode = async () => {
        if (!promoCodeToAdd || !customer) return;

        try {
            const addedCode = await api.post<AssignedPromoCode>(endpoints.customers.addPromoCode(customer.id), {
                code: promoCodeToAdd.toUpperCase(),
            });

            // Update local state with new assigned promo code
            setCustomer({
                ...customer,
                assignedPromoCodes: [...(customer.assignedPromoCodes || []), addedCode],
            });

            toast({
                title: 'Promo code added',
                description: `Code "${promoCodeToAdd.toUpperCase()}" is now available for ${customer.name} to use at checkout.`,
            });
            setPromoCodeToAdd('');
            setIsAddPromoCodeDialogOpen(false);
        } catch (error) {
            console.error('Failed to add promo code:', error);
            toast({
                title: 'Error',
                description: 'Failed to add promo code. The code may be invalid or already assigned.',
                variant: 'destructive',
            });
        }
    };

    // Handle removing a promo code from the customer
    const handleRemovePromoCode = async (codeId: string, codeName: string) => {
        if (!customer) return;

        try {
            await api.delete(endpoints.customers.removePromoCode(customer.id, codeId));

            // Update local state
            setCustomer({
                ...customer,
                assignedPromoCodes: (customer.assignedPromoCodes || []).filter(c => c.id !== codeId),
            });

            toast({
                title: 'Promo code removed',
                description: `Code "${codeName}" has been removed from ${customer.name}'s account.`,
            });
        } catch (error) {
            console.error('Failed to remove promo code:', error);
            toast({
                title: 'Error',
                description: 'Failed to remove promo code. Please try again.',
                variant: 'destructive',
            });
        }
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
                                <PhoneInput
                                    id="phone"
                                    value={editPhone}
                                    onChange={(value) => setEditPhone(value)}
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

                {/* My Promo Codes - Available for ALL customer types */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Ticket className="h-5 w-5" />
                                <div>
                                    <CardTitle>My Promo Codes</CardTitle>
                                    <CardDescription>Codes available for checkout use</CardDescription>
                                </div>
                            </div>
                            <Dialog open={isAddPromoCodeDialogOpen} onOpenChange={setIsAddPromoCodeDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Code
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Promo Code</DialogTitle>
                                        <DialogDescription>
                                            Add an existing promo code to {customer.name}&apos;s account for checkout use
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 pt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="promo-code">Promo Code</Label>
                                            <Input
                                                id="promo-code"
                                                placeholder="e.g., SUMMER20"
                                                value={promoCodeToAdd}
                                                onChange={(e) => setPromoCodeToAdd(e.target.value.toUpperCase())}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Enter an existing promo code to add to this customer&apos;s account
                                            </p>
                                        </div>
                                        <div className="flex gap-3 pt-4">
                                            <Button variant="outline" onClick={() => setIsAddPromoCodeDialogOpen(false)} className="flex-1">
                                                Cancel
                                            </Button>
                                            <Button onClick={handleAddPromoCode} disabled={!promoCodeToAdd} className="flex-1">
                                                Add Code
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {(customer.assignedPromoCodes || []).length === 0 ? (
                            <div className="text-center py-6">
                                <Gift className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                                <p className="text-muted-foreground">No promo codes assigned yet</p>
                                <p className="text-sm text-muted-foreground mt-1">Click &quot;Add Code&quot; to assign a promo code</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {(customer.assignedPromoCodes || []).map((code) => {
                                    const isExpired = code.expiresAt && new Date(code.expiresAt) < new Date();
                                    const isFullyUsed = code.usageLimit !== undefined && code.usedCount >= code.usageLimit;
                                    const isUsable = code.isActive && !isExpired && !isFullyUsed;

                                    return (
                                        <div
                                            key={code.id}
                                            className={`p-4 rounded-lg border ${isUsable
                                                ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'
                                                : 'bg-gray-50 border-gray-200 opacity-70'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge className={`${isUsable ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'} text-base px-3 py-1`}>
                                                        {code.code}
                                                    </Badge>
                                                    {!isUsable && (
                                                        <Badge variant="outline" className="text-gray-500 border-gray-300">
                                                            {isExpired ? 'Expired' : isFullyUsed ? 'Fully Used' : 'Inactive'}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-semibold ${isUsable ? 'text-blue-700' : 'text-gray-500'}`}>
                                                        {code.discountPercent}% off
                                                    </span>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        onClick={() => handleRemovePromoCode(code.id, code.code)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                {code.usageLimit !== undefined && (
                                                    <span className="flex items-center gap-1">
                                                        <Check className="h-3.5 w-3.5" />
                                                        {code.usedCount}/{code.usageLimit} uses
                                                    </span>
                                                )}
                                                {code.expiresAt && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {isExpired ? 'Expired' : `Expires ${new Date(code.expiresAt).toLocaleDateString()}`}
                                                    </span>
                                                )}
                                            </div>
                                            {code.description && (
                                                <p className="text-sm text-muted-foreground mt-2">{code.description}</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Available Credits */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                <div>
                                    <CardTitle>Available Credits</CardTitle>
                                    <CardDescription>Store credit vouchers available for use</CardDescription>
                                </div>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => setIsIssueCreditDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-1" />
                                Issue Credit
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {credits.length === 0 ? (
                            <div className="text-center py-6">
                                <Coins className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                                <p className="text-muted-foreground">No credits available</p>
                                <p className="text-sm text-muted-foreground mt-1">Click "Issue Credit" to add balance</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {credits.map((credit) => {
                                    const isExpired = credit.expiresAt && new Date(credit.expiresAt) < new Date();
                                    const isUsable = credit.isActive && !credit.isUsed && !isExpired;

                                    return (
                                        <div
                                            key={credit.id}
                                            className={`p-4 rounded-lg border ${isUsable
                                                ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
                                                : 'bg-gray-50 border-gray-200 opacity-70'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge className={`${isUsable ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'} text-base px-3 py-1`}>
                                                        ${credit.amount.toFixed(2)}
                                                    </Badge>
                                                    {!isUsable && (
                                                        <Badge variant="outline" className="text-gray-500 border-gray-300">
                                                            {credit.isUsed ? 'Used' : isExpired ? 'Expired' : 'Inactive'}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-sm font-medium text-emerald-700">
                                                    Min. order ${credit.minOrderAmount}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm font-medium text-gray-900">{credit.name}</div>
                                                {credit.expiresAt && (
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {isExpired ? 'Expired' : `Expires ${new Date(credit.expiresAt).toLocaleDateString()}`}
                                                    </div>
                                                )}
                                            </div>
                                            {credit.description && (
                                                <p className="text-sm text-muted-foreground mt-2">{credit.description}</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <IssueCreditDialog
                            open={isIssueCreditDialogOpen}
                            onOpenChange={setIsIssueCreditDialogOpen}
                            onSuccess={fetchCustomerData}
                        />
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
                                                        <p className="font-medium">{order.qbInvoiceId || `Order #${order.id.slice(0, 8)}`}</p>
                                                        {isReferralOrder && (
                                                            <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                                                                Referral
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                                        <span>{formatCurrency(order.total)}</span>
                                                        <span>•</span>
                                                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    {isReferralOrder && (
                                                        <p className="text-sm text-muted-foreground mt-1">
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
