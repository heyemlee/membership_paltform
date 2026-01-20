'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { StatusBadge } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { api, endpoints } from '@/lib/api';
import { SMSCampaign } from '@/types';
import {
    ArrowLeft,
    MessageSquare,
    Users,
    Calendar,
    Send,
    Clock,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CampaignDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [campaign, setCampaign] = useState<SMSCampaign | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const fetchCampaign = async () => {
            try {
                // Fetch all campaigns and find the one with matching id
                const campaigns = await api.get<SMSCampaign[]>(endpoints.sms.campaigns);
                const found = campaigns.find(c => c.id === params.id);
                if (found) {
                    setCampaign(found);
                }
            } catch (error) {
                console.error('Failed to fetch campaign:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load campaign details',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchCampaign();
        }
    }, [params.id]);

    const handleSendCampaign = async () => {
        if (!campaign) return;

        setSending(true);
        try {
            await api.post(endpoints.sms.send(campaign.id), {});
            toast({
                title: 'Campaign Sent',
                description: `Successfully sent to ${campaign.recipientCount} recipients`,
            });
            // Refresh campaign data
            const campaigns = await api.get<SMSCampaign[]>(endpoints.sms.campaigns);
            const updated = campaigns.find(c => c.id === params.id);
            if (updated) {
                setCampaign(updated);
            }
        } catch (error) {
            console.error('Failed to send campaign:', error);
            toast({
                title: 'Error',
                description: 'Failed to send campaign',
                variant: 'destructive',
            });
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">Campaign not found</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{campaign.name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <StatusBadge status={campaign.status} />
                            <span className="text-sm text-muted-foreground">
                                Created {new Date(campaign.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
                {campaign.status === 'DRAFT' && (
                    <Button onClick={handleSendCampaign} disabled={sending}>
                        <Send className="mr-2 h-4 w-4" />
                        {sending ? 'Sending...' : 'Send Now'}
                    </Button>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Stats Cards */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Recipients</p>
                                <p className="text-2xl font-bold">{campaign.recipientCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Sent</p>
                                <p className="text-2xl font-bold">{campaign.sentCount || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <p className="text-xl font-semibold capitalize">{campaign.status.toLowerCase()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Message Content */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Message Content
                    </CardTitle>
                    <CardDescription>
                        {campaign.message.length} characters
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="bg-gray-50 rounded-lg p-4 border">
                        <p className="whitespace-pre-wrap">{campaign.message}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Timeline
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <span className="text-sm">
                                Created on {new Date(campaign.createdAt).toLocaleString()}
                            </span>
                        </div>
                        {campaign.scheduledAt && (
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                                <span className="text-sm">
                                    Scheduled for {new Date(campaign.scheduledAt).toLocaleString()}
                                </span>
                            </div>
                        )}
                        {campaign.sentAt && (
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                                <span className="text-sm">
                                    Sent on {new Date(campaign.sentAt).toLocaleString()}
                                </span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
