'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api, endpoints } from '@/lib/api';
import { DiscountCode } from '@/types';
import { Plus, Ticket, Tag, ChevronRight, Percent, Users, Repeat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const CUSTOMER_TYPE_LABELS: Record<string, { label: string; className: string }> = {
    GC: { label: 'GC', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200' },
    DESIGNER: { label: 'Designer', className: 'bg-violet-100 text-violet-700 hover:bg-violet-100 border-violet-200' },
    WHOLESALE: { label: 'Wholesale', className: 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200' },
    REGULAR: { label: 'Regular', className: 'bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200' },
    OTHER: { label: 'Other', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200' },
};

export default function BenefitsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
    const [activeTab, setActiveTab] = useState('promo');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newCode, setNewCode] = useState('');
    const [newDiscount, setNewDiscount] = useState('10');
    const [newDescription, setNewDescription] = useState('');

    useEffect(() => {
        const fetchDiscountCodes = async () => {
            try {
                const data = await api.get<DiscountCode[]>(endpoints.benefits.discountCodes);
                setDiscountCodes(data);
            } catch (err) {
                console.error('Failed to load discount codes:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDiscountCodes();
    }, []);

    // Filter codes by type
    const promoCodes = discountCodes.filter(c => c.type === 'GENERIC');
    const exclusiveCodes = discountCodes.filter(c => c.type === 'EXCLUSIVE');

    const handleCreatePromoCode = async () => {
        if (!newCode || !newDiscount) return;

        try {
            const newPromoCode = await api.post<DiscountCode>(endpoints.benefits.discountCodes, {
                code: newCode.toUpperCase(),
                type: 'GENERIC',
                description: newDescription || `Promo code ${newCode}`,
                discountPercent: Number(newDiscount),
                isActive: true,
            });

            setDiscountCodes([newPromoCode, ...discountCodes]);
            setNewCode('');
            setNewDiscount('10');
            setNewDescription('');
            setIsCreateDialogOpen(false);

            toast({
                title: 'Promo code created',
                description: `Code "${newPromoCode.code}" has been created successfully.`,
            });
        } catch (error) {
            console.error('Failed to create promo code:', error);
            toast({
                title: 'Error',
                description: 'Failed to create promo code. Please try again.',
                variant: 'destructive',
            });
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
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                </div>
                <Skeleton className="h-[500px] w-full rounded-xl" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50/50 to-gray-100/50 p-8">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Benefits & Discounts</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage promo codes, exclusive offers, and customer benefits.
                        </p>
                    </div>

                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                size="lg"
                                className="bg-black hover:bg-gray-800 text-white shadow-lg shadow-black/10 transition-all hover:shadow-black/20 hover:-translate-y-0.5 rounded-full px-6"
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Add Promo Code
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Promo Code</DialogTitle>
                                <DialogDescription>
                                    Create a new promotional discount code for all customers
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Code</Label>
                                    <Input
                                        id="code"
                                        placeholder="e.g., SPRING20"
                                        value={newCode}
                                        onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="discount">Discount Percentage</Label>
                                    <Select value={newDiscount} onValueChange={setNewDiscount}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="5">5%</SelectItem>
                                            <SelectItem value="10">10%</SelectItem>
                                            <SelectItem value="15">15%</SelectItem>
                                            <SelectItem value="20">20%</SelectItem>
                                            <SelectItem value="25">25%</SelectItem>
                                            <SelectItem value="30">30%</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description (optional)</Label>
                                    <Input
                                        id="description"
                                        placeholder="e.g., Spring Sale Promotion"
                                        value={newDescription}
                                        onChange={(e) => setNewDescription(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1">
                                        Cancel
                                    </Button>
                                    <Button onClick={handleCreatePromoCode} disabled={!newCode} className="flex-1">
                                        Create Code
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* KPI Overview (Optional addition for visual consistency) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-none shadow-md bg-white/60 backdrop-blur-xl hover:bg-white/80 transition-all duration-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between space-y-0 pb-2">
                                <p className="text-sm font-medium text-muted-foreground">Active Promo Codes</p>
                                <span className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                                    <Ticket className="h-4 w-4" />
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2 mt-2">
                                <h2 className="text-3xl font-bold text-gray-900">{promoCodes.filter(c => c.isActive).length}</h2>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-md bg-white/60 backdrop-blur-xl hover:bg-white/80 transition-all duration-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between space-y-0 pb-2">
                                <p className="text-sm font-medium text-muted-foreground">Active Exclusive Codes</p>
                                <span className="bg-violet-100 p-2 rounded-full text-violet-600">
                                    <Tag className="h-4 w-4" />
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2 mt-2">
                                <h2 className="text-3xl font-bold text-gray-900">{exclusiveCodes.filter(c => c.isActive).length}</h2>
                            </div>
                        </CardContent>
                    </Card>

                </div>


                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-white/50 p-1 rounded-full border border-gray-200/50 mb-6">
                        <TabsTrigger
                            value="promo"
                            className="rounded-full px-6 py-2.5 data-[state=active]:bg-black data-[state=active]:text-white transition-all"
                        >
                            <Ticket className="h-4 w-4 mr-2" />
                            Promo Codes
                        </TabsTrigger>
                        <TabsTrigger
                            value="exclusive"
                            className="rounded-full px-6 py-2.5 data-[state=active]:bg-black data-[state=active]:text-white transition-all"
                        >
                            <Tag className="h-4 w-4 mr-2" />
                            Customer Exclusive Codes
                        </TabsTrigger>
                    </TabsList>

                    {/* Promo Codes Tab */}
                    <TabsContent value="promo" className="mt-0">
                        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden rounded-2xl">
                            <CardHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Promo Codes</CardTitle>
                                        <CardDescription>General discount codes available for all customers</CardDescription>
                                    </div>
                                    <div className="text-sm text-muted-foreground bg-gray-50 px-3 py-1 rounded-full">
                                        {promoCodes.length} active codes
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {promoCodes.length === 0 ? (
                                    <div className="text-center py-24 text-muted-foreground">
                                        <div className="bg-gray-50 p-4 rounded-full inline-flex mb-4">
                                            <Ticket className="h-8 w-8 opacity-50" />
                                        </div>
                                        <p className="text-lg font-medium text-gray-900">No promo codes yet</p>
                                        <p className="text-sm mt-1">Create your first promo code to get started</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent border-gray-100 bg-gray-50/50">
                                                <TableHead className="pl-6 h-12">Code</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Discount</TableHead>
                                                <TableHead className="text-center">Uses</TableHead>
                                                <TableHead className="text-center">Users</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {promoCodes.map((code) => (
                                                <TableRow
                                                    key={code.id}
                                                    className="cursor-pointer hover:bg-blue-50/50 transition-colors border-gray-100 group"
                                                    onClick={() => router.push(`/benefits/${code.id}`)}
                                                >
                                                    <TableCell className="pl-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform">
                                                                <Percent className="h-5 w-5" />
                                                            </div>
                                                            <span className="font-bold text-gray-900">{code.code}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">{code.description}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100">
                                                            {code.discountPercent}% off
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="font-medium text-gray-900">{code.usageCount}</div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="font-medium text-gray-900">{code.uniqueUsersCount}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={cn("rounded-full font-medium border",
                                                            code.isActive
                                                                ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                                                : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100"
                                                        )}>
                                                            {code.isActive ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Customer Exclusive Codes Tab */}
                    <TabsContent value="exclusive" className="mt-0">
                        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden rounded-2xl">
                            <CardHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Customer Exclusive Codes</CardTitle>
                                        <CardDescription>Personal discount codes created for specific customers</CardDescription>
                                    </div>
                                    <div className="text-sm text-muted-foreground bg-gray-50 px-3 py-1 rounded-full">
                                        {exclusiveCodes.length} active codes
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {exclusiveCodes.length === 0 ? (
                                    <div className="text-center py-24 text-muted-foreground">
                                        <div className="bg-gray-50 p-4 rounded-full inline-flex mb-4">
                                            <Users className="h-8 w-8 opacity-50" />
                                        </div>
                                        <p className="text-lg font-medium text-gray-900">No exclusive codes</p>
                                        <p className="text-sm mt-1">No customer-specific codes have been created yet</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent border-gray-100 bg-gray-50/50">
                                                <TableHead className="pl-6 h-12">Code</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Discount</TableHead>
                                                <TableHead className="text-center">Uses</TableHead>
                                                <TableHead className="text-center">Users</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {exclusiveCodes.map((code) => {
                                                const typeConfig = CUSTOMER_TYPE_LABELS[code.assignedTo?.customerType || 'OTHER'];
                                                return (
                                                    <TableRow
                                                        key={code.id}
                                                        className="cursor-pointer hover:bg-blue-50/50 transition-colors border-gray-100 group"
                                                        onClick={() => router.push(`/benefits/${code.id}`)}
                                                    >
                                                        <TableCell className="pl-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform">
                                                                    <Tag className="h-5 w-5" />
                                                                </div>
                                                                <span className="font-bold text-gray-900">{code.code}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="font-medium text-gray-900">{code.assignedTo?.customerName}</TableCell>
                                                        <TableCell>
                                                            <Badge className={cn("rounded-full border font-medium", typeConfig.className)} variant="secondary">
                                                                {typeConfig.label}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary" className="bg-violet-50 text-violet-700 hover:bg-violet-50 border-violet-100">
                                                                {code.discountPercent}% off
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <div className="font-medium text-gray-900">{code.usageCount}</div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <div className="font-medium text-gray-900">{code.uniqueUsersCount}</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={cn("rounded-full font-medium border",
                                                                code.isActive
                                                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                                                    : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100"
                                                            )}>
                                                                {code.isActive ? 'Active' : 'Inactive'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
