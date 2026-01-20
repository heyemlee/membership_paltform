'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api, endpoints } from '@/lib/api';
import { DiscountCode, ContactList } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import {
    ArrowLeft,
    Percent,
    Users,
    DollarSign,
    Calendar,
    Tag,
    User,
    ShoppingCart,
    Clock,
    UserPlus,
    Trash2,
    ListFilter,
    X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CUSTOMER_TYPE_LABELS: Record<string, { label: string; className: string }> = {
    GC: { label: 'GC', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    DESIGNER: { label: 'Designer', className: 'bg-violet-100 text-violet-800 border-violet-200' },
    WHOLESALE: { label: 'Wholesale', className: 'bg-amber-100 text-amber-800 border-amber-200' },
    REGULAR: { label: 'Regular', className: 'bg-slate-100 text-slate-800 border-slate-200' },
    OTHER: { label: 'Other', className: 'bg-gray-100 text-gray-800 border-gray-200' },
};

const CUSTOMER_TYPES = ['GC', 'DESIGNER', 'WHOLESALE', 'REGULAR'];

export default function BenefitDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [code, setCode] = useState<DiscountCode | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [assignTab, setAssignTab] = useState('type');
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedLists, setSelectedLists] = useState<string[]>([]);
    const [contactLists, setContactLists] = useState<ContactList[]>([]);
    const [loadingLists, setLoadingLists] = useState(false);
    const [assigning, setAssigning] = useState(false);

    const fetchCode = async () => {
        try {
            const data = await api.get<DiscountCode>(endpoints.benefits.discountCodeDetail(params.id as string));
            setCode(data);
        } catch (err) {
            console.error('Failed to load discount code:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchContactLists = async () => {
        setLoadingLists(true);
        try {
            const data = await api.get<ContactList[]>(endpoints.contacts.lists);
            setContactLists(data);
        } catch (err) {
            console.error('Failed to load contact lists:', err);
        } finally {
            setLoadingLists(false);
        }
    };

    useEffect(() => {
        fetchCode();
    }, [params.id]);

    useEffect(() => {
        if (isAssignDialogOpen && assignTab === 'lists' && contactLists.length === 0) {
            fetchContactLists();
        }
    }, [isAssignDialogOpen, assignTab]);

    const handleAssignByType = async () => {
        if (selectedTypes.length === 0) return;

        setAssigning(true);
        console.log('Starting batch assign by type:', selectedTypes);

        try {
            const result = await api.post<{ success: boolean; message: string; assigned: number }>(
                endpoints.benefits.assignByType(params.id as string),
                { customerTypes: selectedTypes }
            );

            console.log('Batch assign result:', result);

            toast({
                title: 'Assignment Complete',
                description: result.message,
            });

            setIsAssignDialogOpen(false);
            setSelectedTypes([]);
            fetchCode(); // Refresh the code data
        } catch (err: any) {
            console.error('Failed to assign by type:', err);
            console.error('Error details:', err?.message, err?.status);
            toast({
                title: 'Error',
                description: `Failed to assign promo code: ${err?.message || 'Unknown error'}`,
                variant: 'destructive',
            });
        } finally {
            setAssigning(false);
        }
    };

    const handleAssignByLists = async () => {
        if (selectedLists.length === 0) return;

        setAssigning(true);
        try {
            const result = await api.post<{ success: boolean; message: string; assigned: number }>(
                endpoints.benefits.assignByLists(params.id as string),
                { listIds: selectedLists }
            );

            toast({
                title: 'Assignment Complete',
                description: result.message,
            });

            setIsAssignDialogOpen(false);
            setSelectedLists([]);
            fetchCode(); // Refresh the code data
        } catch (err) {
            console.error('Failed to assign by lists:', err);
            toast({
                title: 'Error',
                description: 'Failed to assign promo code. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setAssigning(false);
        }
    };

    const handleRemoveAssignment = async (assignmentId: string) => {
        try {
            await api.delete(endpoints.benefits.removeAssignment(params.id as string, assignmentId));
            toast({
                title: 'Removed',
                description: 'Assignment removed successfully.',
            });
            fetchCode();
        } catch (err) {
            console.error('Failed to remove assignment:', err);
            toast({
                title: 'Error',
                description: 'Failed to remove assignment.',
                variant: 'destructive',
            });
        }
    };

    const handleClearAllAssignments = async () => {
        if (!confirm('Are you sure you want to remove all assignments?')) return;

        try {
            const result = await api.delete<{ success: boolean; message: string; removed: number }>(
                endpoints.benefits.clearAssignments(params.id as string)
            );
            toast({
                title: 'Cleared',
                description: result.message,
            });
            fetchCode();
        } catch (err) {
            console.error('Failed to clear assignments:', err);
            toast({
                title: 'Error',
                description: 'Failed to clear assignments.',
                variant: 'destructive',
            });
        }
    };

    const toggleType = (type: string) => {
        setSelectedTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const toggleList = (listId: string) => {
        setSelectedLists(prev =>
            prev.includes(listId)
                ? prev.filter(l => l !== listId)
                : [...prev, listId]
        );
    };

    if (loading) {
        return (
            <div className="space-y-6 p-6">
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
            <div className="space-y-6 p-6">
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
    const assignedCustomers = code.assignedCustomers || [];
    const totalDiscountGiven = usageHistory.reduce((sum, u) => sum + u.discountAmount, 0);
    const totalOrderValue = usageHistory.reduce((sum, u) => sum + u.orderTotal, 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50/50 to-gray-100/50 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">{code.code}</h1>
                        <Badge className={cn(
                            "rounded-full",
                            code.isActive
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-800 border-slate-200'
                        )}>
                            {code.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline" className="rounded-full">
                            {code.type === 'GENERIC' ? 'Promo Code' : 'Exclusive'}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1">{code.description}</p>
                </div>

                {/* Assign Button */}
                {code.type === 'GENERIC' && (
                    <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-black hover:bg-gray-800 text-white rounded-full px-6">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Batch Assign
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Batch Assign Promo Code</DialogTitle>
                                <DialogDescription>
                                    Assign this promo code to customers by type or contact list
                                </DialogDescription>
                            </DialogHeader>

                            <Tabs value={assignTab} onValueChange={setAssignTab} className="w-full mt-4">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="type" className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        By Type
                                    </TabsTrigger>
                                    <TabsTrigger value="lists" className="flex items-center gap-2">
                                        <ListFilter className="h-4 w-4" />
                                        By Lists
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="type" className="mt-4 space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        Select customer types to assign this promo code to all customers of those types.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {CUSTOMER_TYPES.map(type => {
                                            const config = CUSTOMER_TYPE_LABELS[type];
                                            const isSelected = selectedTypes.includes(type);
                                            return (
                                                <div
                                                    key={type}
                                                    className={cn(
                                                        "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                                                        isSelected
                                                            ? "border-black bg-gray-50"
                                                            : "border-gray-200 hover:border-gray-300"
                                                    )}
                                                    onClick={() => toggleType(type)}
                                                >
                                                    <Checkbox checked={isSelected} />
                                                    <Badge className={cn("rounded-full border", config.className)}>
                                                        {config.label}
                                                    </Badge>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <Button
                                        className="w-full"
                                        onClick={handleAssignByType}
                                        disabled={selectedTypes.length === 0 || assigning}
                                    >
                                        {assigning ? 'Assigning...' : `Assign to ${selectedTypes.length} type(s)`}
                                    </Button>
                                </TabsContent>

                                <TabsContent value="lists" className="mt-4 space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        Select contact lists to assign this promo code to all customers in those lists.
                                    </p>
                                    {loadingLists ? (
                                        <div className="space-y-2">
                                            {[1, 2, 3].map(i => (
                                                <Skeleton key={i} className="h-14 w-full" />
                                            ))}
                                        </div>
                                    ) : contactLists.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <ListFilter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p>No contact lists available</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {contactLists.map(list => {
                                                const isSelected = selectedLists.includes(list.id);
                                                return (
                                                    <div
                                                        key={list.id}
                                                        className={cn(
                                                            "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                                                            isSelected
                                                                ? "border-black bg-gray-50"
                                                                : "border-gray-200 hover:border-gray-300"
                                                        )}
                                                        onClick={() => toggleList(list.id)}
                                                    >
                                                        <Checkbox checked={isSelected} />
                                                        <div className="flex-1">
                                                            <p className="font-medium">{list.name}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {list.count} contacts
                                                            </p>
                                                        </div>
                                                        <Badge variant="outline" className="rounded-full">
                                                            {list.type === 'CUSTOMER_SYNC' ? 'Synced' : 'Imported'}
                                                        </Badge>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    <Button
                                        className="w-full"
                                        onClick={handleAssignByLists}
                                        disabled={selectedLists.length === 0 || assigning}
                                    >
                                        {assigning ? 'Assigning...' : `Assign to ${selectedLists.length} list(s)`}
                                    </Button>
                                </TabsContent>
                            </Tabs>
                        </DialogContent>
                    </Dialog>
                )}
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
                <Card className="border-none shadow-md bg-white/80">
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
                <Card className="border-none shadow-md bg-white/80">
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
                <Card className="border-none shadow-md bg-white/80">
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
                <Card className="border-none shadow-md bg-white/80">
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

            {/* Assigned Customers (for promo codes) */}
            {code.type === 'GENERIC' && assignedCustomers.length > 0 && (
                <Card className="border-none shadow-xl bg-white/80 rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <UserPlus className="h-5 w-5" />
                                Assigned Customers
                            </CardTitle>
                            <CardDescription>
                                {assignedCustomers.length} customers have been assigned this promo code
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearAllAssignments}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear All
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50">
                                    <TableHead className="pl-6">Customer</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Assigned At</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignedCustomers.map((assignment) => {
                                    const typeConfig = CUSTOMER_TYPE_LABELS[assignment.customerType] || CUSTOMER_TYPE_LABELS.OTHER;
                                    return (
                                        <TableRow
                                            key={assignment.id}
                                            className="hover:bg-muted/50 group"
                                        >
                                            <TableCell className="pl-6 font-medium">
                                                <button
                                                    className="text-left hover:underline"
                                                    onClick={() => router.push(`/customers/${assignment.customerId}`)}
                                                >
                                                    {assignment.customerName}
                                                </button>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn("rounded-full border", typeConfig.className)} variant="outline">
                                                    {typeConfig.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(assignment.assignedAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleRemoveAssignment(assignment.id)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Usage History */}
            <Card className="border-none shadow-xl bg-white/80 rounded-2xl">
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
                                <TableRow className="bg-gray-50/50">
                                    <TableHead className="pl-6">Customer</TableHead>
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
                                            <TableCell className="pl-6 font-medium">{usage.customerName}</TableCell>
                                            <TableCell>
                                                <Badge className={cn("rounded-full border", typeConfig.className)} variant="outline">
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
