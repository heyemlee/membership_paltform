'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ContactList } from '@/types';
import { api, endpoints } from '@/lib/api';
import {
    Upload, FileSpreadsheet, Users, ArrowLeft,
    RefreshCw, Trash2, Database
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

// Customer types for sync filtering
const CUSTOMER_TYPES = [
    { value: 'REGULAR', label: 'Regular' },
    { value: 'GC', label: 'GC (General Contractor)' },
    { value: 'DESIGNER', label: 'Designer' },
    { value: 'WHOLESALE', label: 'Wholesale' },
];

export default function ContactListsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [lists, setLists] = useState<ContactList[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

    // Create form state
    const [newListName, setNewListName] = useState('');
    const [newListDescription, setNewListDescription] = useState('');
    const [selectedCustomerTypes, setSelectedCustomerTypes] = useState<string[]>([]);

    // Import form state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [parsedContacts, setParsedContacts] = useState<{ name: string; phone?: string; email?: string }[]>([]);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchLists();
    }, []);

    const fetchLists = async () => {
        try {
            setLoading(true);
            const data = await api.get<ContactList[]>(endpoints.contacts.lists);
            setLists(data);
        } catch (error) {
            console.error('Failed to fetch contact lists:', error);
            toast({
                title: 'Error',
                description: 'Failed to load contact lists',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (listId: string) => {
        router.push(`/sms/lists/${listId}`);
    };

    const handleCreateSyncList = async () => {
        if (!newListName) return;

        try {
            await api.post(endpoints.contacts.createFromCustomers, {
                name: newListName,
                description: newListDescription,
                customerTypes: selectedCustomerTypes.length > 0 ? selectedCustomerTypes : undefined,
            });

            toast({
                title: 'List Created',
                description: `"${newListName}" has been created and synced with customers.`,
            });

            resetCreateForm();
            setIsCreateDialogOpen(false);
            fetchLists();
        } catch (error) {
            console.error('Failed to create list:', error);
            toast({
                title: 'Error',
                description: 'Failed to create contact list',
                variant: 'destructive',
            });
        }
    };

    const handleSyncList = async (e: React.MouseEvent, listId: string) => {
        e.stopPropagation(); // Prevent row click
        try {
            const result = await api.post<{ count: number }>(endpoints.contacts.syncCustomers(listId), {});
            toast({
                title: 'Sync Complete',
                description: `Synced ${result.count} customers to the list.`,
            });
            fetchLists();
        } catch (error) {
            console.error('Failed to sync list:', error);
            toast({
                title: 'Error',
                description: 'Failed to sync customers',
                variant: 'destructive',
            });
        }
    };

    const handleDeleteList = async (e: React.MouseEvent, listId: string) => {
        e.stopPropagation(); // Prevent row click
        if (!confirm('Are you sure you want to delete this list?')) return;

        try {
            await api.delete(endpoints.contacts.listDetail(listId));
            toast({
                title: 'List Deleted',
                description: 'Contact list has been deleted.',
            });
            fetchLists();
        } catch (error) {
            console.error('Failed to delete list:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete contact list',
                variant: 'destructive',
            });
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);

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

                return { name: String(name), phone: String(phone), email: String(email) };
            }).filter(c => c.name || c.phone || c.email);

            setParsedContacts(contacts);

            toast({
                title: 'File Parsed',
                description: `Found ${contacts.length} contacts in the file.`,
            });
        } catch (error) {
            console.error('Failed to parse file:', error);
            toast({
                title: 'Error',
                description: 'Failed to parse the file. Please ensure it is a valid Excel or CSV file.',
                variant: 'destructive',
            });
        }
    };

    const handleImportList = async () => {
        if (!newListName || parsedContacts.length === 0) return;

        try {
            setImporting(true);

            const list = await api.post<ContactList>(endpoints.contacts.lists, {
                name: newListName,
                description: newListDescription,
                type: 'MANUAL_IMPORT',
            });

            await api.post(endpoints.contacts.import, {
                listId: list.id,
                contacts: parsedContacts,
            });

            toast({
                title: 'Import Complete',
                description: `Imported ${parsedContacts.length} contacts to "${newListName}".`,
            });

            resetCreateForm();
            setIsImportDialogOpen(false);
            fetchLists();
        } catch (error) {
            console.error('Failed to import list:', error);
            toast({
                title: 'Error',
                description: 'Failed to import contacts',
                variant: 'destructive',
            });
        } finally {
            setImporting(false);
        }
    };

    const resetCreateForm = () => {
        setNewListName('');
        setNewListDescription('');
        setSelectedCustomerTypes([]);
        setSelectedFile(null);
        setParsedContacts([]);
    };

    const toggleCustomerType = (type: string) => {
        setSelectedCustomerTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    // Get customer types display string
    const getCustomerTypesDisplay = (list: ContactList) => {
        if (list.type !== 'CUSTOMER_SYNC' || !list.filterCriteria) return null;
        const types = (list.filterCriteria as any)?.customerTypes;
        if (!types || types.length === 0) return 'All Types';
        return types.map((t: string) => {
            const found = CUSTOMER_TYPES.find(ct => ct.value === t);
            return found ? found.label.split(' ')[0] : t;
        }).join(', ');
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-20 w-64" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <PageHeader
                        title="Contact Lists"
                        description="Manage customer lists for SMS and email campaigns"
                    />
                </div>
                <div className="flex gap-2">
                    {/* Import List Button */}
                    <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Upload className="mr-2 h-4 w-4" />
                                Import List
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Import Contact List</DialogTitle>
                                <DialogDescription>
                                    Upload an Excel or CSV file. The system will automatically detect name, phone number, and email columns.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="import-name">List Name</Label>
                                    <Input
                                        id="import-name"
                                        placeholder="e.g., Summer Conference Leads"
                                        value={newListName}
                                        onChange={(e) => setNewListName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="import-description">Description (Optional)</Label>
                                    <Input
                                        id="import-description"
                                        placeholder="Brief description of this list"
                                        value={newListDescription}
                                        onChange={(e) => setNewListDescription(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Upload File</Label>
                                    <div
                                        className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <FileSpreadsheet className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-sm font-medium text-gray-900">
                                            {selectedFile ? selectedFile.name : 'Click to select file'}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Supports .xlsx, .xls, .csv
                                        </p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".xlsx,.xls,.csv"
                                            className="hidden"
                                            onChange={handleFileSelect}
                                        />
                                    </div>
                                    {parsedContacts.length > 0 && (
                                        <p className="text-sm text-green-600 mt-2">
                                            ✓ Found {parsedContacts.length} contacts ready to import
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            resetCreateForm();
                                            setIsImportDialogOpen(false);
                                        }}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleImportList}
                                        disabled={!newListName || parsedContacts.length === 0 || importing}
                                        className="flex-1"
                                    >
                                        {importing ? 'Importing...' : 'Import'}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Create from Customers Button */}
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Database className="mr-2 h-4 w-4" />
                                Sync from Customers
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Create List from Customers</DialogTitle>
                                <DialogDescription>
                                    Create a contact list that syncs with your customer database. You can filter by customer type.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="sync-name">List Name</Label>
                                    <Input
                                        id="sync-name"
                                        placeholder="e.g., All VIP Customers"
                                        value={newListName}
                                        onChange={(e) => setNewListName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sync-description">Description (Optional)</Label>
                                    <Input
                                        id="sync-description"
                                        placeholder="Brief description of this list"
                                        value={newListDescription}
                                        onChange={(e) => setNewListDescription(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Filter by Customer Type (Optional)</Label>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        Leave unchecked to include all customers
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {CUSTOMER_TYPES.map((type) => (
                                            <div
                                                key={type.value}
                                                className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-muted/50 cursor-pointer"
                                                onClick={() => toggleCustomerType(type.value)}
                                            >
                                                <Checkbox
                                                    checked={selectedCustomerTypes.includes(type.value)}
                                                    onCheckedChange={() => toggleCustomerType(type.value)}
                                                />
                                                <span className="text-sm">{type.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            resetCreateForm();
                                            setIsCreateDialogOpen(false);
                                        }}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCreateSyncList}
                                        disabled={!newListName}
                                        className="flex-1"
                                    >
                                        Create & Sync
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Lists Table */}
            <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-gray-100">
                                <TableHead className="pl-6 h-12 w-[250px]">List Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="w-[100px] text-center">Contacts</TableHead>
                                <TableHead className="w-[120px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lists.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                        No contact lists yet. Create one by syncing from customers or importing a file.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                lists.map((list) => (
                                    <TableRow
                                        key={list.id}
                                        className="hover:bg-gray-50/50 border-gray-100 cursor-pointer"
                                        onClick={() => handleRowClick(list.id)}
                                    >
                                        <TableCell className="pl-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${list.type === 'CUSTOMER_SYNC'
                                                    ? 'bg-blue-50 text-blue-600'
                                                    : 'bg-green-50 text-green-600'
                                                    }`}>
                                                    {list.type === 'CUSTOMER_SYNC' ? (
                                                        <Database className="h-4 w-4" />
                                                    ) : (
                                                        <Upload className="h-4 w-4" />
                                                    )}
                                                </div>
                                                <span className="font-medium text-gray-900">{list.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {list.description || '-'}
                                        </TableCell>
                                        <TableCell className="text-center font-medium">
                                            {list.count}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                                {list.type === 'CUSTOMER_SYNC' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => handleSyncList(e, list.id)}
                                                        title="Sync"
                                                    >
                                                        <RefreshCw className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700"
                                                    onClick={(e) => handleDeleteList(e, list.id)}
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
