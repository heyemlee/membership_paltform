'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Send } from 'lucide-react';
import { mockContactLists } from '@/lib/mock-data';
import { SelectGroup, SelectLabel, SelectSeparator } from '@/components/ui/select';

export default function CreateSMSPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [recipient, setRecipient] = useState('ALL');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        if (!name || !message) return;

        setSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        alert('Campaign created successfully!');
        router.push('/sms/campaigns');
    };

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
                        <Select value={recipient} onValueChange={setRecipient}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Customer Types</SelectLabel>
                                    <SelectItem value="ALL">All Customers</SelectItem>
                                    <SelectItem value="GC">General Contractors</SelectItem>
                                    <SelectItem value="DESIGNER">Designers</SelectItem>
                                    <SelectItem value="REGULAR">Regular Customers</SelectItem>
                                    <SelectItem value="WHOLESALE">Wholesale</SelectItem>
                                </SelectGroup>
                                <SelectSeparator />
                                <SelectGroup>
                                    <SelectLabel>Saved Lists</SelectLabel>
                                    {mockContactLists.map(list => (
                                        <SelectItem key={list.id} value={`LIST:${list.id}`}>
                                            {list.name} ({list.count})
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
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
                        <Button onClick={handleSubmit} disabled={!name || !message || saving}>
                            <Send className="mr-2 h-4 w-4" />
                            {saving ? 'Creating...' : 'Create Campaign'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
