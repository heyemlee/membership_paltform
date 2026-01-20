'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { api, endpoints } from '@/lib/api';
import { CreditSource, IssueByTypeRequest, IssueByListsRequest, IssueByCustomersRequest, Customer } from '@/types';
import { Gift, Users, List, UserCheck, Loader2, CheckCircle, DollarSign, ShoppingCart, Calendar, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ContactList {
    id: string;
    name: string;
    count: number;
    type: string;
}

interface IssueCreditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const CREDIT_SOURCES: { value: CreditSource; label: string; icon: string }[] = [
    { value: 'PROMOTION', label: 'Promotion', icon: '🎉' },
    { value: 'BIRTHDAY', label: 'Birthday', icon: '🎂' },
    { value: 'REFERRAL', label: 'Referral', icon: '🤝' },
    { value: 'COMPENSATION', label: 'Compensation', icon: '💝' },
    { value: 'MANUAL', label: 'Manual', icon: '✍️' },
];

const CUSTOMER_TYPES = [
    { value: 'GC', label: 'GC', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'DESIGNER', label: 'Designer', className: 'bg-violet-100 text-violet-700 border-violet-200' },
    { value: 'WHOLESALE', label: 'Wholesale', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    { value: 'REGULAR', label: 'Regular', className: 'bg-slate-100 text-slate-700 border-slate-200' },
];

type DistributionMethod = 'type' | 'list' | 'manual';

export function IssueCreditDialog({ open, onOpenChange, onSuccess }: IssueCreditDialogProps) {
    const { toast } = useToast();

    // Form state - Credit details
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [minOrderAmount, setMinOrderAmount] = useState('');
    const [source, setSource] = useState<CreditSource>('PROMOTION');
    const [hasExpiry, setHasExpiry] = useState(false);
    const [expiresInDays, setExpiresInDays] = useState('30');

    // Distribution method
    const [distributionMethod, setDistributionMethod] = useState<DistributionMethod>('type');
    const [selectedCustomerTypes, setSelectedCustomerTypes] = useState<string[]>([]);
    const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
    const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);

    // Data
    const [contactLists, setContactLists] = useState<ContactList[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [customerSearch, setCustomerSearch] = useState('');
    const [loadingLists, setLoadingLists] = useState(false);
    const [loadingCustomers, setLoadingCustomers] = useState(false);

    // Submit state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
    const [issueResult, setIssueResult] = useState<{ issued: number; batchId: string } | null>(null);

    // Load contact lists when distribution method is 'list'
    useEffect(() => {
        if (distributionMethod === 'list' && contactLists.length === 0) {
            setLoadingLists(true);
            api.get<ContactList[]>(endpoints.contacts.lists)
                .then(data => setContactLists(data))
                .catch(err => console.error('Failed to load contact lists:', err))
                .finally(() => setLoadingLists(false));
        }
    }, [distributionMethod, contactLists.length]);

    // Load customers when distribution method is 'manual'
    useEffect(() => {
        if (distributionMethod === 'manual' && customers.length === 0) {
            setLoadingCustomers(true);
            api.get<{ data: Customer[]; meta: unknown }>(endpoints.customers.list)
                .then(response => setCustomers(response.data || []))
                .catch(err => console.error('Failed to load customers:', err))
                .finally(() => setLoadingCustomers(false));
        }
    }, [distributionMethod, customers.length]);

    // Filter customers by search
    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone.includes(customerSearch) ||
        c.email?.toLowerCase().includes(customerSearch.toLowerCase())
    );

    const toggleCustomerType = (type: string) => {
        setSelectedCustomerTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const toggleListId = (id: string) => {
        setSelectedListIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleCustomerId = (id: string) => {
        setSelectedCustomerIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const getRecipientCount = (): string => {
        if (distributionMethod === 'type') {
            return selectedCustomerTypes.length > 0
                ? `All ${selectedCustomerTypes.join(', ')} customers`
                : 'Select customer types';
        } else if (distributionMethod === 'list') {
            const totalCount = contactLists
                .filter(l => selectedListIds.includes(l.id))
                .reduce((sum, l) => sum + l.count, 0);
            return selectedListIds.length > 0 ? `~${totalCount} contacts` : 'Select lists';
        } else {
            return selectedCustomerIds.length > 0
                ? `${selectedCustomerIds.length} customers`
                : 'Select customers';
        }
    };

    const canProceed = (): boolean => {
        if (!name || !amount || !minOrderAmount) return false;
        if (distributionMethod === 'type' && selectedCustomerTypes.length === 0) return false;
        if (distributionMethod === 'list' && selectedListIds.length === 0) return false;
        if (distributionMethod === 'manual' && selectedCustomerIds.length === 0) return false;
        return true;
    };

    const handleSubmit = async () => {
        if (!canProceed()) return;

        setIsSubmitting(true);

        try {
            const basePayload = {
                name,
                description: description || undefined,
                amount: Number(amount),
                minOrderAmount: Number(minOrderAmount),
                source,
                expiresInDays: hasExpiry ? Number(expiresInDays) : undefined,
            };

            let result: { issued: number; batchId: string };

            if (distributionMethod === 'type') {
                const payload: IssueByTypeRequest = {
                    ...basePayload,
                    customerTypes: selectedCustomerTypes,
                };
                result = await api.post(endpoints.credits.issueByType, payload);
            } else if (distributionMethod === 'list') {
                const payload: IssueByListsRequest = {
                    ...basePayload,
                    listIds: selectedListIds,
                };
                result = await api.post(endpoints.credits.issueByLists, payload);
            } else {
                const payload: IssueByCustomersRequest = {
                    ...basePayload,
                    customerIds: selectedCustomerIds,
                };
                result = await api.post(endpoints.credits.issueByCustomers, payload);
            }

            setIssueResult(result);
            setStep('success');

            toast({
                title: 'Credits issued successfully',
                description: `Issued ${result.issued} credits to customers.`,
            });

            onSuccess?.();
        } catch (error) {
            console.error('Failed to issue credits:', error);
            toast({
                title: 'Error',
                description: 'Failed to issue credits. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        setAmount('');
        setMinOrderAmount('');
        setSource('PROMOTION');
        setHasExpiry(false);
        setExpiresInDays('30');
        setDistributionMethod('type');
        setSelectedCustomerTypes([]);
        setSelectedListIds([]);
        setSelectedCustomerIds([]);
        setStep('form');
        setIssueResult(null);
    };

    const handleClose = () => {
        resetForm();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-emerald-600" />
                        Issue Credit Vouchers
                    </DialogTitle>
                    <DialogDescription>
                        Create and distribute credit vouchers to your customers
                    </DialogDescription>
                </DialogHeader>

                {step === 'form' && (
                    <div className="space-y-6 py-4">
                        {/* Credit Details Section */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">
                                Voucher Details
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="name">Voucher Name *</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g., New Year Gift, Birthday Reward"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="amount" className="flex items-center gap-1">
                                        <DollarSign className="h-3.5 w-3.5" />
                                        Amount *
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                        <Input
                                            id="amount"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="50"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="pl-7"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="minOrder" className="flex items-center gap-1">
                                        <ShoppingCart className="h-3.5 w-3.5" />
                                        Min. Order Amount *
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                        <Input
                                            id="minOrder"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="200"
                                            value={minOrderAmount}
                                            onChange={(e) => setMinOrderAmount(e.target.value)}
                                            className="pl-7"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Customer must spend at least this amount to use the voucher
                                    </p>
                                </div>

                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="description">Description (optional)</Label>
                                    <Input
                                        id="description"
                                        placeholder="e.g., Thank you for being a loyal customer!"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Source / Occasion</Label>
                                    <Select value={source} onValueChange={(v) => setSource(v as CreditSource)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CREDIT_SOURCES.map(s => (
                                                <SelectItem key={s.value} value={s.value}>
                                                    <span className="flex items-center gap-2">
                                                        <span>{s.icon}</span>
                                                        <span>{s.label}</span>
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Validity
                                    </Label>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="hasExpiry"
                                                checked={hasExpiry}
                                                onCheckedChange={(checked) => setHasExpiry(checked === true)}
                                            />
                                            <Label htmlFor="hasExpiry" className="text-sm font-normal cursor-pointer">
                                                Expires in
                                            </Label>
                                        </div>
                                        {hasExpiry ? (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={expiresInDays}
                                                    onChange={(e) => setExpiresInDays(e.target.value)}
                                                    className="w-20"
                                                />
                                                <span className="text-sm text-muted-foreground">days</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-emerald-600 font-medium">Never expires</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Distribution Method Section */}
                        <div className="space-y-4 border-t pt-6">
                            <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">
                                Distribution Method
                            </h3>

                            <RadioGroup
                                value={distributionMethod}
                                onValueChange={(v) => setDistributionMethod(v as DistributionMethod)}
                                className="grid grid-cols-3 gap-3"
                            >
                                <Label
                                    htmlFor="method-type"
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                        distributionMethod === 'type'
                                            ? "border-emerald-500 bg-emerald-50"
                                            : "border-gray-200 hover:border-gray-300"
                                    )}
                                >
                                    <RadioGroupItem value="type" id="method-type" className="sr-only" />
                                    <Users className={cn("h-6 w-6", distributionMethod === 'type' ? "text-emerald-600" : "text-gray-400")} />
                                    <span className={cn("text-sm font-medium", distributionMethod === 'type' ? "text-emerald-700" : "text-gray-600")}>
                                        By Customer Type
                                    </span>
                                </Label>

                                <Label
                                    htmlFor="method-list"
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                        distributionMethod === 'list'
                                            ? "border-emerald-500 bg-emerald-50"
                                            : "border-gray-200 hover:border-gray-300"
                                    )}
                                >
                                    <RadioGroupItem value="list" id="method-list" className="sr-only" />
                                    <List className={cn("h-6 w-6", distributionMethod === 'list' ? "text-emerald-600" : "text-gray-400")} />
                                    <span className={cn("text-sm font-medium", distributionMethod === 'list' ? "text-emerald-700" : "text-gray-600")}>
                                        By Contact List
                                    </span>
                                </Label>

                                <Label
                                    htmlFor="method-manual"
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                        distributionMethod === 'manual'
                                            ? "border-emerald-500 bg-emerald-50"
                                            : "border-gray-200 hover:border-gray-300"
                                    )}
                                >
                                    <RadioGroupItem value="manual" id="method-manual" className="sr-only" />
                                    <UserCheck className={cn("h-6 w-6", distributionMethod === 'manual' ? "text-emerald-600" : "text-gray-400")} />
                                    <span className={cn("text-sm font-medium", distributionMethod === 'manual' ? "text-emerald-700" : "text-gray-600")}>
                                        Select Customers
                                    </span>
                                </Label>
                            </RadioGroup>

                            {/* Customer Type Selection */}
                            {distributionMethod === 'type' && (
                                <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                                    <Label className="text-sm font-medium">Select Customer Types</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {CUSTOMER_TYPES.map(type => (
                                            <Badge
                                                key={type.value}
                                                variant="outline"
                                                className={cn(
                                                    "cursor-pointer px-4 py-2 text-sm transition-all",
                                                    selectedCustomerTypes.includes(type.value)
                                                        ? type.className + " ring-2 ring-offset-2 ring-emerald-500"
                                                        : "bg-white hover:bg-gray-100"
                                                )}
                                                onClick={() => toggleCustomerType(type.value)}
                                            >
                                                {selectedCustomerTypes.includes(type.value) && (
                                                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                                )}
                                                {type.label}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Contact List Selection */}
                            {distributionMethod === 'list' && (
                                <div className="space-y-3 p-4 bg-gray-50 rounded-xl max-h-48 overflow-y-auto">
                                    <Label className="text-sm font-medium">Select Contact Lists</Label>
                                    {loadingLists ? (
                                        <div className="flex items-center justify-center py-4">
                                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : contactLists.length === 0 ? (
                                        <p className="text-sm text-muted-foreground py-4 text-center">
                                            No contact lists found
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {contactLists.map(list => (
                                                <div
                                                    key={list.id}
                                                    className={cn(
                                                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                                                        selectedListIds.includes(list.id)
                                                            ? "border-emerald-500 bg-emerald-50"
                                                            : "border-gray-200 bg-white hover:border-gray-300"
                                                    )}
                                                    onClick={() => toggleListId(list.id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Checkbox
                                                            checked={selectedListIds.includes(list.id)}
                                                            className="pointer-events-none"
                                                        />
                                                        <span className="font-medium">{list.name}</span>
                                                    </div>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {list.count} contacts
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Manual Customer Selection */}
                            {distributionMethod === 'manual' && (
                                <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium">Select Customers</Label>
                                        {selectedCustomerIds.length > 0 && (
                                            <Badge variant="secondary">
                                                {selectedCustomerIds.length} selected
                                            </Badge>
                                        )}
                                    </div>
                                    <Input
                                        placeholder="Search by name, phone, or email..."
                                        value={customerSearch}
                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                    />
                                    {loadingCustomers ? (
                                        <div className="flex items-center justify-center py-4">
                                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : (
                                        <div className="max-h-48 overflow-y-auto space-y-2">
                                            {filteredCustomers.slice(0, 50).map(customer => (
                                                <div
                                                    key={customer.id}
                                                    className={cn(
                                                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                                                        selectedCustomerIds.includes(customer.id)
                                                            ? "border-emerald-500 bg-emerald-50"
                                                            : "border-gray-200 bg-white hover:border-gray-300"
                                                    )}
                                                    onClick={() => toggleCustomerId(customer.id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Checkbox
                                                            checked={selectedCustomerIds.includes(customer.id)}
                                                            className="pointer-events-none"
                                                        />
                                                        <div>
                                                            <p className="font-medium">{customer.name}</p>
                                                            <p className="text-xs text-muted-foreground">{customer.phone}</p>
                                                        </div>
                                                    </div>
                                                    <Badge
                                                        variant="secondary"
                                                        className={CUSTOMER_TYPES.find(t => t.value === customer.type)?.className}
                                                    >
                                                        {customer.type}
                                                    </Badge>
                                                </div>
                                            ))}
                                            {filteredCustomers.length > 50 && (
                                                <p className="text-xs text-muted-foreground text-center py-2">
                                                    Showing first 50 results. Use search to find more.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Summary & Actions */}
                        <div className="border-t pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-sm text-muted-foreground">
                                    <span className="font-medium text-gray-900">Recipients: </span>
                                    {getRecipientCount()}
                                </div>
                                {amount && minOrderAmount && (
                                    <div className="text-sm text-muted-foreground">
                                        <span className="font-medium text-emerald-600">${amount}</span>
                                        <span> off orders over </span>
                                        <span className="font-medium">${minOrderAmount}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={handleClose}>
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => setStep('confirm')}
                                    disabled={!canProceed()}
                                >
                                    Review & Issue
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'confirm' && (
                    <div className="space-y-6 py-4">
                        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                            <h3 className="font-semibold text-lg">Confirm Credit Issuance</h3>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Voucher Name</span>
                                    <p className="font-medium">{name}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Amount</span>
                                    <p className="font-medium text-emerald-600">${amount}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Min. Order</span>
                                    <p className="font-medium">${minOrderAmount}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Validity</span>
                                    <p className="font-medium">{hasExpiry ? `${expiresInDays} days` : 'Never expires'}</p>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-muted-foreground">Recipients</span>
                                    <p className="font-medium">{getRecipientCount()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setStep('form')}>
                                Back
                            </Button>
                            <Button
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Issuing...
                                    </>
                                ) : (
                                    <>
                                        <Gift className="h-4 w-4 mr-2" />
                                        Issue Credits
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'success' && issueResult && (
                    <div className="py-8 text-center space-y-6">
                        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle className="h-8 w-8 text-emerald-600" />
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold text-gray-900">Credits Issued Successfully!</h3>
                            <p className="text-muted-foreground mt-2">
                                {issueResult.issued} credit vouchers have been issued to customers.
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 inline-flex items-center gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Batch ID</p>
                                <p className="font-mono text-sm">{issueResult.batchId.slice(0, 8)}...</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Issued</p>
                                <p className="font-semibold text-emerald-600">{issueResult.issued} vouchers</p>
                            </div>
                        </div>

                        <Button onClick={handleClose} className="px-8">
                            Done
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
