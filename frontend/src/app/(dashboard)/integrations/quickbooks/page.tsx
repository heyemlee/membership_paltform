'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, RefreshCw, Clock, FileText } from 'lucide-react';

export default function QuickBooksPage() {
    const [syncing, setSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState('5 minutes ago');

    const handleSync = async () => {
        setSyncing(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setSyncing(false);
        setLastSyncTime('Just now');
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="QuickBooks Integration"
                description="Sync orders and invoices with QuickBooks Online"
            />

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Connection Status */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Connection Status</CardTitle>
                            <Badge className="bg-emerald-100 text-emerald-800">Connected</Badge>
                        </div>
                        <CardDescription>QuickBooks Online connection is active</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                            <CheckCircle className="h-8 w-8 text-emerald-600" />
                            <div>
                                <p className="font-medium text-emerald-900">Connected to QuickBooks</p>
                                <p className="text-sm text-emerald-700">
                                    Syncing orders automatically
                                </p>
                            </div>
                        </div>

                        <Button onClick={handleSync} disabled={syncing} className="w-full">
                            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Syncing...' : 'Sync Now'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Sync Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sync Settings</CardTitle>
                        <CardDescription>Automatic synchronization configuration</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Auto Sync</span>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-800">Enabled</Badge>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Sync Interval</span>
                            <span className="font-medium">Every 15 minutes</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Last Sync</span>
                            <span className="font-medium">{lastSyncTime}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Orders Synced Today</span>
                            <span className="font-medium">23</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Sync Stats */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            <CardTitle>Sync Statistics</CardTitle>
                        </div>
                        <CardDescription>Overview of data synchronization</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="p-4 rounded-lg bg-muted/50 text-center">
                                <p className="text-3xl font-bold text-foreground">1,642</p>
                                <p className="text-sm text-muted-foreground">Total Orders Synced</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50 text-center">
                                <p className="text-3xl font-bold text-foreground">248</p>
                                <p className="text-sm text-muted-foreground">Customers Linked</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50 text-center">
                                <p className="text-3xl font-bold text-emerald-600">99.8%</p>
                                <p className="text-sm text-muted-foreground">Sync Success Rate</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50 text-center">
                                <p className="text-3xl font-bold text-foreground">0</p>
                                <p className="text-sm text-muted-foreground">Pending Errors</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
