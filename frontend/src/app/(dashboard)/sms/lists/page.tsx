'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { mockContactLists } from '@/lib/mock-data';
import { ContactList } from '@/types';
import { Upload, FileSpreadsheet, Users, Calendar, Plus, UserPlus, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function ContactListsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [lists, setLists] = useState<ContactList[]>([]);
    const [loading, setLoading] = useState(true);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

    // Import form state
    const [newListName, setNewListName] = useState('');
    const [newListDescription, setNewListDescription] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLists(mockContactLists);
            setLoading(false);
        }, 600);
        return () => clearTimeout(timer);
    }, []);

    const handleImportList = () => {
        if (!newListName || !selectedFile) return;

        const newList: ContactList = {
            id: `list-${Date.now()}`,
            name: newListName,
            description: newListDescription,
            count: Math.floor(Math.random() * 100) + 10, // Mock count
            source: 'EXCEL_IMPORT',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        setLists([newList, ...lists]);
        setIsImportDialogOpen(false);
        setNewListName('');
        setNewListDescription('');
        setSelectedFile(null);

        toast({
            title: 'List Imported Successfully',
            description: `${newList.name} has been created with ${newList.count} contacts.`,
        });
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
                        description="Manage customer lists for SMS campaigns"
                    />
                </div>
                <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Upload className="mr-2 h-4 w-4" />
                            Import List
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Import Contact List</DialogTitle>
                            <DialogDescription>
                                Upload an Excel or CSV file containing customer details.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">List Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., Summer Conference Leads"
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Input
                                    id="description"
                                    placeholder="Brief description of this list"
                                    value={newListDescription}
                                    onChange={(e) => setNewListDescription(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="file">Upload File</Label>
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => document.getElementById('file-upload')?.click()}>
                                    <FileSpreadsheet className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                    <p className="text-sm font-medium text-gray-900">
                                        {selectedFile ? selectedFile.name : 'Click to select file'}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Support .xlsx, .xls, .csv
                                    </p>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)} className="flex-1">
                                    Cancel
                                </Button>
                                <Button onClick={handleImportList} disabled={!newListName || !selectedFile} className="flex-1">
                                    Import
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-gray-100">
                                <TableHead className="pl-6 h-12 w-[250px]">List Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="w-[100px] text-center">Contacts</TableHead>
                                <TableHead className="w-[150px]">Source</TableHead>
                                <TableHead className="w-[150px]">Created</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lists.map((list) => (
                                <TableRow key={list.id} className="hover:bg-gray-50/50 border-gray-100">
                                    <TableCell className="pl-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                                <Users className="h-4 w-4" />
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
                                        <Badge variant="outline" className="bg-white">
                                            {list.source === 'EXCEL_IMPORT' ? 'Import' :
                                                list.source === 'MANUAL' ? 'Manual' : 'System'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {new Date(list.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm">Details</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
