'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ContactList, Contact } from '@/types';
import { api, endpoints } from '@/lib/api';
import { ArrowLeft, RefreshCw, Database, Upload, Users, Trash2, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Customer type display mapping
const CUSTOMER_TYPE_LABELS: Record<string, { label: string; color: string }> = {
    'GC': { label: 'GC', color: 'bg-blue-100 text-blue-700' },
    'DESIGNER': { label: 'Designer', color: 'bg-purple-100 text-purple-700' },
    'REGULAR': { label: 'Regular', color: 'bg-gray-100 text-gray-700' },
    'WHOLESALE': { label: 'Wholesale', color: 'bg-green-100 text-green-700' },
};

// Sort order for customer types
const TYPE_SORT_ORDER: Record<string, number> = {
    'GC': 1,
    'DESIGNER': 2,
    'WHOLESALE': 3,
    'REGULAR': 4,
};

export default function ContactListDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [list, setList] = useState<ContactList | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [sortByType, setSortByType] = useState(false);

    const listId = params.id as string;

    useEffect(() => {
        if (listId) {
            fetchListDetail();
        }
    }, [listId]);

    const fetchListDetail = async () => {
        try {
            setLoading(true);
            const data = await api.get<ContactList>(endpoints.contacts.listDetail(listId));
            setList(data);
        } catch (error) {
            console.error('Failed to fetch list details:', error);
            toast({
                title: 'Error',
                description: 'Failed to load list details',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    // Sort contacts by type if enabled
    const sortedContacts = useMemo(() => {
        if (!list?.contacts) return [];
        if (!sortByType) return list.contacts;

        return [...list.contacts].sort((a, b) => {
            const orderA = TYPE_SORT_ORDER[a.customerType || ''] || 99;
            const orderB = TYPE_SORT_ORDER[b.customerType || ''] || 99;
            return orderA - orderB;
        });
    }, [list?.contacts, sortByType]);

    const handleSync = async () => {
        if (!list || list.type !== 'CUSTOMER_SYNC') return;

        try {
            setSyncing(true);
            const result = await api.post<{ count: number }>(
                endpoints.contacts.syncCustomers(listId),
                {}
            );
            toast({
                title: 'Sync Complete',
                description: `Synced ${result.count} customers to the list.`,
            });
            fetchListDetail();
        } catch (error) {
            console.error('Failed to sync:', error);
            toast({
                title: 'Error',
                description: 'Failed to sync customers',
                variant: 'destructive',
            });
        } finally {
            setSyncing(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this list?')) return;

        try {
            await api.delete(endpoints.contacts.listDetail(listId));
            toast({
                title: 'List Deleted',
                description: 'Contact list has been deleted.',
            });
            router.push('/sms/lists');
        } catch (error) {
            console.error('Failed to delete:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete list',
                variant: 'destructive',
            });
        }
    };

    const handleContactClick = (contact: Contact) => {
        if (contact.customerId) {
            router.push(`/customers/${contact.customerId}`);
        }
    };

    const toggleSortByType = () => {
        setSortByType(!sortByType);
    };

    // Get type badge for a contact
    const getTypeBadge = (customerType?: string) => {
        if (!customerType) return <span className="text-muted-foreground">-</span>;
        const config = CUSTOMER_TYPE_LABELS[customerType] || { label: customerType, color: 'bg-gray-100 text-gray-700' };
        return (
            <Badge variant="secondary" className={`${config.color} border-0`}>
                {config.label}
            </Badge>
        );
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-16 w-64" />
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!list) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <PageHeader title="List Not Found" description="" />
                </div>
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        The contact list you're looking for doesn't exist.
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/sms/lists')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${list.type === 'CUSTOMER_SYNC'
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'bg-green-100 text-green-600'
                                }`}>
                                {list.type === 'CUSTOMER_SYNC' ? (
                                    <Database className="h-5 w-5" />
                                ) : (
                                    <Upload className="h-5 w-5" />
                                )}
                            </div>
                            {list.name}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {list.description || 'No description'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {list.type === 'CUSTOMER_SYNC' && (
                        <Button variant="outline" onClick={handleSync} disabled={syncing}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Syncing...' : 'Sync Now'}
                        </Button>
                    )}
                    <Button variant="destructive" onClick={handleDelete}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* List Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Contacts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            <span className="text-2xl font-bold">{list.count}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Last Synced
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-sm">
                            {list.lastSyncedAt
                                ? new Date(list.lastSyncedAt).toLocaleString()
                                : 'Never'}
                        </span>
                    </CardContent>
                </Card>
            </div>

            {/* Contacts Table */}
            <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Contacts</CardTitle>
                    <CardDescription>
                        {sortedContacts.length === 100
                            ? 'Showing first 100 contacts'
                            : `${sortedContacts.length} contacts in this list`}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-gray-100">
                                <TableHead className="pl-6 h-12">Name</TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/50 select-none"
                                    onClick={toggleSortByType}
                                >
                                    <div className="flex items-center gap-2">
                                        Type
                                        <ArrowUpDown className={`h-4 w-4 ${sortByType ? 'text-primary' : 'text-muted-foreground'}`} />
                                    </div>
                                </TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Email</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedContacts.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="text-center py-12 text-muted-foreground"
                                    >
                                        No contacts in this list
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedContacts.map((contact) => (
                                    <TableRow
                                        key={contact.id}
                                        className={`hover:bg-gray-50/50 border-gray-100 ${contact.customerId ? 'cursor-pointer' : ''
                                            }`}
                                        onClick={() => handleContactClick(contact)}
                                    >
                                        <TableCell className="pl-6 py-4">
                                            <span className={`font-medium ${contact.customerId
                                                    ? 'text-primary hover:underline'
                                                    : 'text-gray-900'
                                                }`}>
                                                {contact.name}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {getTypeBadge(contact.customerType)}
                                        </TableCell>
                                        <TableCell>{contact.phone || '-'}</TableCell>
                                        <TableCell>{contact.email || '-'}</TableCell>
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
