'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { api, endpoints } from '@/lib/api';
import { Customer } from '@/types';
import {
    Search,
    Plus,
    Users,
    Star,
    TrendingUp,
    MoreHorizontal,
    ArrowUpRight,
    Sparkles,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    AlertCircle,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

const CUSTOMER_TYPE_LABELS: Record<string, { label: string; className: string; icon?: React.ElementType }> = {
    GC: { label: 'GC', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200' },
    DESIGNER: { label: 'Designer', className: 'bg-violet-100 text-violet-700 hover:bg-violet-100 border-violet-200' },
    WHOLESALE: { label: 'Wholesale', className: 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200' },
    REGULAR: { label: 'Regular', className: 'bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200' },
    OTHER: { label: 'Other', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200' },
};

// Sort order for customer types
const TYPE_SORT_ORDER: Record<string, number> = {
    'GC': 1,
    'DESIGNER': 2,
    'WHOLESALE': 3,
    'REGULAR': 4,
    'OTHER': 5,
};

interface CustomersResponse {
    data: Customer[];
    meta: { total: number; page: number; limit: number; totalPages: number };
}

interface BulkImportResult {
    imported: number;
    skipped: number;
    failed: number;
    errors: string[];
}

interface ParsedCustomer {
    name: string;
    phone?: string;
    email?: string;
}

type SortField = 'type' | 'points' | null;
type SortDirection = 'asc' | 'desc';

export default function CustomersPage() {
    const router = useRouter();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [totalCustomers, setTotalCustomers] = useState(0);
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Import dialog state
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [importStep, setImportStep] = useState<'upload' | 'preview' | 'result'>('upload');
    const [selectedType, setSelectedType] = useState('REGULAR');
    const [parsedCustomers, setParsedCustomers] = useState<ParsedCustomer[]>([]);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<BulkImportResult | null>(null);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const response = await api.get<CustomersResponse>(`${endpoints.customers.list}?limit=100`);
            setCustomers(response.data);
            setTotalCustomers(response.meta.total);
        } catch (err) {
            console.error('Failed to load customers:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    // Filter customers by search
    const filteredCustomers = useMemo(() => {
        return customers.filter(customer => {
            const query = searchQuery.toLowerCase();
            return (
                customer.name.toLowerCase().includes(query) ||
                (customer.email && customer.email.toLowerCase().includes(query)) ||
                customer.phone.toLowerCase().includes(query)
            );
        });
    }, [customers, searchQuery]);

    // Sort filtered customers
    const sortedCustomers = useMemo(() => {
        if (!sortField) return filteredCustomers;

        return [...filteredCustomers].sort((a, b) => {
            if (sortField === 'type') {
                const orderA = TYPE_SORT_ORDER[a.type] || 99;
                const orderB = TYPE_SORT_ORDER[b.type] || 99;
                return sortDirection === 'asc' ? orderA - orderB : orderB - orderA;
            } else if (sortField === 'points') {
                return sortDirection === 'asc' ? a.points - b.points : b.points - a.points;
            }
            return 0;
        });
    }, [filteredCustomers, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            if (sortDirection === 'desc') {
                setSortDirection('asc');
            } else {
                setSortField(null);
            }
        } else {
            setSortField(field);
            setSortDirection(field === 'points' ? 'desc' : 'asc');
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
        }
        return sortDirection === 'desc'
            ? <ArrowDown className="h-4 w-4 text-primary" />
            : <ArrowUp className="h-4 w-4 text-primary" />;
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-red-100 text-red-700',
            'bg-orange-100 text-orange-700',
            'bg-amber-100 text-amber-700',
            'bg-green-100 text-green-700',
            'bg-emerald-100 text-emerald-700',
            'bg-teal-100 text-teal-700',
            'bg-cyan-100 text-cyan-700',
            'bg-blue-100 text-blue-700',
            'bg-indigo-100 text-indigo-700',
            'bg-violet-100 text-violet-700',
            'bg-purple-100 text-purple-700',
            'bg-fuchsia-100 text-fuchsia-700',
            'bg-pink-100 text-pink-700',
            'bg-rose-100 text-rose-700',
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    // File upload handler
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const contacts = jsonData.map((row: any) => {
                const name = row.name || row.Name || row.NAME ||
                    row['Customer Name'] || row['customer_name'] ||
                    row['Full Name'] || row.full_name || '';

                const phone = row.phone || row.Phone || row.PHONE ||
                    row['Phone Number'] || row['phone_number'] ||
                    row['phone number'] || row['PHONE NUMBER'] ||
                    row['phonenumber'] || row['PhoneNumber'] ||
                    row.tel || row.Tel || row.TEL ||
                    row.telephone || row.Telephone ||
                    row.mobile || row.Mobile || row.cell || '';

                const email = row.email || row.Email || row.EMAIL ||
                    row['Email Address'] || row['email_address'] || '';

                return {
                    name: String(name || phone || 'Unknown'),
                    phone: String(phone),
                    email: String(email)
                };
            }).filter((c: ParsedCustomer) => c.phone); // Filter out entries without phone

            setParsedCustomers(contacts);
            setImportStep('preview');

            toast({
                title: 'File Parsed',
                description: `Found ${contacts.length} customers with phone numbers.`,
            });
        } catch (error) {
            console.error('Failed to parse file:', error);
            toast({
                title: 'Error',
                description: 'Failed to parse file. Please check the format.',
                variant: 'destructive',
            });
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Import customers
    const handleImport = async () => {
        if (parsedCustomers.length === 0) return;

        setImporting(true);
        try {
            const result = await api.post<BulkImportResult>(endpoints.customers.bulkImport, {
                type: selectedType,
                customers: parsedCustomers,
                skipDuplicates: true,
            });

            setImportResult(result);
            setImportStep('result');

            if (result.imported > 0) {
                toast({
                    title: 'Import Complete',
                    description: `Successfully imported ${result.imported} customers.`,
                });
                fetchCustomers(); // Refresh the list
            }
        } catch (error) {
            console.error('Failed to import:', error);
            toast({
                title: 'Error',
                description: 'Failed to import customers. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setImporting(false);
        }
    };

    // Reset import dialog
    const resetImportDialog = () => {
        setImportStep('upload');
        setParsedCustomers([]);
        setImportResult(null);
        setSelectedType('REGULAR');
    };

    const handleDialogClose = (open: boolean) => {
        setIsImportDialogOpen(open);
        if (!open) {
            resetImportDialog();
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
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
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
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Customers</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage relationships, track points, and view customer history.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {/* Import Button */}
                        <Dialog open={isImportDialogOpen} onOpenChange={handleDialogClose}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="bg-white hover:bg-gray-50 shadow-sm border-gray-200"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Import Customers
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <FileSpreadsheet className="h-5 w-5" />
                                        Import Customers
                                    </DialogTitle>
                                    <DialogDescription>
                                        Upload an Excel or CSV file to batch import customers
                                    </DialogDescription>
                                </DialogHeader>

                                {/* Step 1: Upload */}
                                {importStep === 'upload' && (
                                    <div className="space-y-6 pt-4">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Customer Type</Label>
                                                <Select value={selectedType} onValueChange={setSelectedType}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="GC">GC (General Contractor)</SelectItem>
                                                        <SelectItem value="DESIGNER">Designer</SelectItem>
                                                        <SelectItem value="WHOLESALE">Wholesale</SelectItem>
                                                        <SelectItem value="REGULAR">Regular</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-xs text-muted-foreground">
                                                    All imported customers will be assigned this type
                                                </p>
                                            </div>

                                            <div
                                                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-gray-300 transition-colors cursor-pointer"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept=".xlsx,.xls,.csv"
                                                    onChange={handleFileUpload}
                                                    className="hidden"
                                                />
                                                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                                                <p className="font-medium">Click to upload file</p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Excel (.xlsx, .xls) or CSV files
                                                </p>
                                            </div>

                                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                                                <p className="text-sm text-blue-700">
                                                    <strong>Supported columns:</strong> Name, Phone, Phone Number, Email
                                                </p>
                                                <p className="text-sm text-blue-600 mt-1">
                                                    Duplicates (based on phone number) will be automatically skipped.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Preview */}
                                {importStep === 'preview' && (
                                    <div className="space-y-4 pt-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{parsedCustomers.length} customers found</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Will be imported as <Badge className={cn("ml-1", CUSTOMER_TYPE_LABELS[selectedType]?.className)}>{CUSTOMER_TYPE_LABELS[selectedType]?.label}</Badge>
                                                </p>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={resetImportDialog}>
                                                <X className="h-4 w-4 mr-1" />
                                                Start Over
                                            </Button>
                                        </div>

                                        <div className="border rounded-lg max-h-64 overflow-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-[50px]">#</TableHead>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Phone</TableHead>
                                                        <TableHead>Email</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {parsedCustomers.slice(0, 10).map((c, i) => (
                                                        <TableRow key={i}>
                                                            <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                                                            <TableCell>{c.name}</TableCell>
                                                            <TableCell>{c.phone}</TableCell>
                                                            <TableCell>{c.email || '-'}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {parsedCustomers.length > 10 && (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                                ... and {parsedCustomers.length - 10} more
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <Button variant="outline" onClick={resetImportDialog} className="flex-1">
                                                Cancel
                                            </Button>
                                            <Button onClick={handleImport} disabled={importing} className="flex-1">
                                                {importing ? 'Importing...' : `Import ${parsedCustomers.length} Customers`}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Result */}
                                {importStep === 'result' && importResult && (
                                    <div className="space-y-6 pt-4">
                                        <div className="text-center py-4">
                                            {importResult.imported > 0 ? (
                                                <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
                                            ) : (
                                                <AlertCircle className="h-16 w-16 mx-auto text-amber-500 mb-4" />
                                            )}
                                            <h3 className="text-xl font-semibold">Import Complete</h3>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-emerald-50 rounded-lg p-4 text-center">
                                                <p className="text-2xl font-bold text-emerald-700">{importResult.imported}</p>
                                                <p className="text-sm text-emerald-600">Imported</p>
                                            </div>
                                            <div className="bg-amber-50 rounded-lg p-4 text-center">
                                                <p className="text-2xl font-bold text-amber-700">{importResult.skipped}</p>
                                                <p className="text-sm text-amber-600">Skipped (duplicates)</p>
                                            </div>
                                            <div className="bg-red-50 rounded-lg p-4 text-center">
                                                <p className="text-2xl font-bold text-red-700">{importResult.failed}</p>
                                                <p className="text-sm text-red-600">Failed</p>
                                            </div>
                                        </div>

                                        {importResult.errors.length > 0 && (
                                            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                                                <p className="font-medium text-red-700 mb-2">Errors:</p>
                                                <ul className="text-sm text-red-600 space-y-1">
                                                    {importResult.errors.slice(0, 5).map((err, i) => (
                                                        <li key={i}>• {err}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <Button onClick={() => handleDialogClose(false)} className="w-full">
                                            Done
                                        </Button>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>

                        {/* Add Customer Button */}
                        <Button
                            size="lg"
                            onClick={() => router.push('/customers/new')}
                            className="bg-black hover:bg-gray-800 text-white shadow-lg shadow-black/10 transition-all hover:shadow-black/20 hover:-translate-y-0.5 rounded-full px-6"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Add New Customer
                        </Button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-2xl mx-auto w-full">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <Input
                            placeholder="Search by name, email, or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-14 text-lg bg-white border-2 border-gray-200 focus:border-black focus:ring-black/10 transition-all rounded-full shadow-lg shadow-gray-200/50"
                        />
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full hover:bg-gray-100 h-10 w-10 p-0"
                                onClick={() => setSearchQuery('')}
                            >
                                <span className="sr-only">Clear</span>
                                <span className="text-xl">×</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden rounded-2xl">
                    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Users className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground font-medium">Total Customers</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl font-bold text-gray-900">{totalCustomers}</span>
                                    </div>
                                </div>
                            </div>
                            {searchQuery && (
                                <div className="text-sm text-muted-foreground bg-gray-50 px-3 py-1.5 rounded-full">
                                    Found {sortedCustomers.length} result{sortedCustomers.length !== 1 ? 's' : ''}
                                </div>
                            )}
                        </div>
                    </div>

                    <CardContent className="p-0">
                        {sortedCustomers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="bg-gray-50 p-4 rounded-full mb-4">
                                    <Users className="h-8 w-8 text-muted-foreground opacity-50" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">No customers found</h3>
                                <p className="text-muted-foreground max-w-sm mt-2">
                                    We couldn't find any customers matching your search. Try adjusting terms or add a new customer.
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-gray-100 bg-gray-50/50">
                                        <TableHead className="pl-6 h-12 font-semibold">Customer</TableHead>
                                        <TableHead className="font-semibold">Contact</TableHead>
                                        <TableHead
                                            className="font-semibold cursor-pointer hover:bg-muted/50 select-none"
                                            onClick={() => handleSort('type')}
                                        >
                                            <div className="flex items-center gap-2">
                                                Type
                                                {getSortIcon('type')}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="text-center font-semibold cursor-pointer hover:bg-muted/50 select-none"
                                            onClick={() => handleSort('points')}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                Points
                                                {getSortIcon('points')}
                                            </div>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedCustomers.map((customer) => {
                                        const typeConfig = CUSTOMER_TYPE_LABELS[customer.type] || CUSTOMER_TYPE_LABELS.REGULAR;
                                        const Icon = typeConfig.icon;

                                        return (
                                            <TableRow
                                                key={customer.id}
                                                className="cursor-pointer hover:bg-blue-50/50 transition-colors border-gray-100 group"
                                                onClick={() => router.push(`/customers/${customer.id}`)}
                                            >
                                                <TableCell className="pl-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-transform group-hover:scale-105",
                                                            getAvatarColor(customer.name)
                                                        )}>
                                                            {getInitials(customer.name)}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900">{customer.name}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-sm text-gray-700">{customer.phone}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={cn("rounded-full px-2.5 py-0.5 border font-medium", typeConfig.className)} variant="secondary">
                                                        {Icon && <Icon className="w-3 h-3 mr-1" />}
                                                        {typeConfig.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="font-bold text-emerald-700 bg-emerald-50 inline-block px-2 py-0.5 rounded-md border border-emerald-100">
                                                        {customer.points.toLocaleString()}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                        <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between text-xs text-muted-foreground">
                            <span>Page 1 of 1</span>
                            <span>{sortedCustomers.length} records</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
