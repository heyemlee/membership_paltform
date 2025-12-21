'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout';
import { StatusBadge } from '@/components/common';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { mockSMSCampaigns } from '@/lib/mock-data';
import { SMSCampaign } from '@/types';
import { Plus, MessageSquare, Users, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function SMSCampaignsPage() {
    const [campaigns, setCampaigns] = useState<SMSCampaign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setCampaigns(mockSMSCampaigns);
            setLoading(false);
        }, 600);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="space-y-6">
            <PageHeader title="SMS Campaigns" description="Manage your SMS marketing campaigns">
                <div className="flex gap-3">
                    <Link href="/sms/lists">
                        <Button variant="outline">
                            <Users className="mr-2 h-4 w-4" />
                            Manage Lists
                        </Button>
                    </Link>
                    <Link href="/sms/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Campaign
                        </Button>
                    </Link>
                </div>
            </PageHeader>

            {loading ? (
                <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-24" />
                    ))}
                </div>
            ) : campaigns.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">No campaigns yet</p>
                        <p className="text-sm text-muted-foreground mb-4">Create your first SMS campaign</p>
                        <Link href="/sms/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Campaign
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {campaigns.map((campaign) => (
                        <Card key={campaign.id}>
                            <CardContent className="flex items-center justify-between p-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-semibold text-foreground">{campaign.name}</h3>
                                        <StatusBadge status={campaign.status} />
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-1 max-w-xl">
                                        {campaign.message}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            <span>{campaign.recipientCount} recipients</span>
                                        </div>
                                        {campaign.sentAt && (
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>Sent {new Date(campaign.sentAt).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                        {campaign.scheduledAt && campaign.status === 'SCHEDULED' && (
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>Scheduled {new Date(campaign.scheduledAt).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <Button variant="outline" size="sm">View Details</Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
