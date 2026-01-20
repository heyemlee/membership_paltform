'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Send } from 'lucide-react';
import { ContactList } from '@/types';
import { api, endpoints } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function CreateSMSPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [selectedListId, setSelectedListId] = useState('');
    const [saving, setSaving] = useState(false);
    const [contactLists, setContactLists] = useState<ContactList[]>([]);
    const [loadingLists, setLoadingLists] = useState(true);

    useEffect(() => {
        fetchContactLists();
    }, []);

    const fetchContactLists = async () => {
        try {
            setLoadingLists(true);
            const data = await api.get<ContactList[]>(endpoints.contacts.lists);
            setContactLists(data);
        } catch (error) {
            console.error('Failed to fetch contact lists:', error);
        } finally {
            setLoadingLists(false);
        }
    };

    const handleSubmit = async () => {
        if (!name || !message || !selectedListId) return;

        setSaving(true);
        try {
            await api.post(endpoints.sms.campaigns, {
                name,
                message,
                recipientFilter: 'CUSTOM',
                targetListIds: [selectedListId],
            });

            toast({
                title: 'Campaign Created',
                description: 'Your SMS campaign has been created successfully.',
            });
            router.push('/sms/campaigns');
        } catch (error) {
            console.error('Failed to create campaign:', error);
            toast({
                title: 'Error',
                description: 'Failed to create campaign. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const selectedList = contactLists.find(l => l.id === selectedListId);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <PageHeader
                    title="Create SMS Campaign"
                    description="Send promotional messages to your customers"
                />
            </div>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Campaign Details</CardTitle>
                    <CardDescription>Configure your SMS campaign settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Campaign Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Summer Sale Announcement"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="recipient">Recipients</Label>
                        {loadingLists ? (
                            <Skeleton className="h-10 w-full" />
                        ) : contactLists.length > 0 ? (
                            <Select value={selectedListId} onValueChange={setSelectedListId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a contact list" />
                                </SelectTrigger>
                                <SelectContent>
                                    {contactLists.map(list => (
                                        <SelectItem key={list.id} value={list.id}>
                                            {list.name} ({list.count} contacts)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="p-4 border rounded-lg bg-muted/50 text-center">
                                <p className="text-sm text-muted-foreground mb-2">
                                    No contact lists available
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push('/sms/lists')}
                                >
                                    Create Contact List
                                </Button>
                            </div>
                        )}
                        {selectedList && (
                            <p className="text-xs text-muted-foreground">
                                This campaign will be sent to {selectedList.count} contacts
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Enter your message here..."
                            rows={4}
                        />
                        <p className="text-xs text-muted-foreground">
                            {message.length}/160 characters
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => router.back()}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!name || !message || !selectedListId || saving}
                        >
                            <Send className="mr-2 h-4 w-4" />
                            {saving ? 'Creating...' : 'Create Campaign'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
