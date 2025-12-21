'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, Percent, Coins, Loader2, Store, TrendingUp, DollarSign, Wallet } from 'lucide-react';
import { mockSettings } from '@/lib/mock-data';
import { Slider } from '@/components/ui/slider';

export default function SettingsPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Discount Rates
    const [gcDiscount, setGcDiscount] = useState(25);
    const [designerDiscount, setDesignerDiscount] = useState(25);
    const [wholesaleDiscount, setWholesaleDiscount] = useState(25);

    // Points Config
    const [earnRate, setEarnRate] = useState(1);
    const [pointsPerDollar, setPointsPerDollar] = useState(100);

    // Wholesale Program Config
    const [wholesaleInitialShareDiscount, setWholesaleInitialShareDiscount] = useState(20);
    const [wholesaleUpgradeThreshold, setWholesaleUpgradeThreshold] = useState(10000);
    const [wholesaleUpgradedShareDiscount, setWholesaleUpgradedShareDiscount] = useState(25);
    const [wholesaleCommissionWithdrawThreshold, setWholesaleCommissionWithdrawThreshold] = useState(500);

    // Load settings on mount (using mock data)
    useEffect(() => {
        const timer = setTimeout(() => {
            // Load from mock data
            setGcDiscount(mockSettings.discountRates.GC);
            setDesignerDiscount(mockSettings.discountRates.DESIGNER);
            setWholesaleDiscount(mockSettings.discountRates.WHOLESALE);

            setEarnRate(mockSettings.pointsConfig.earnRate);
            setPointsPerDollar(mockSettings.pointsConfig.pointsPerDollar);

            setLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    const handleSaveDiscountRates = async () => {
        setSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        setSaving(false);
        toast({
            title: 'Discount rates saved',
            description: 'Customer type discount rates have been updated successfully.',
        });
    };

    const handleSavePointsConfig = async () => {
        setSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        setSaving(false);
        toast({
            title: 'Points rules saved',
            description: 'Points configuration has been updated successfully.',
        });
    };

    const handleSaveWholesaleConfig = async () => {
        setSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        setSaving(false);
        toast({
            title: 'Wholesale program saved',
            description: 'Wholesale program settings have been updated successfully.',
        });
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Settings"
                    description="Configure customer discounts and points rules"
                />
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Settings"
                description="Configure customer discounts and points rules (Admin only)"
            />

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Customer Type Discounts */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-blue-100">
                                <Percent className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle>Customer Type Discounts</CardTitle>
                                <CardDescription>
                                    Set fixed discount rates for each customer type
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* GC Discount */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="gc-discount" className="text-base font-medium">
                                    GC (General Contractor)
                                </Label>
                                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                    {gcDiscount}% off
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <Slider
                                    id="gc-discount"
                                    min={0}
                                    max={50}
                                    step={1}
                                    value={[gcDiscount]}
                                    onValueChange={(value) => setGcDiscount(value[0])}
                                    className="flex-1"
                                />
                                <div className="w-16 text-right">
                                    <Input
                                        type="number"
                                        min={0}
                                        max={50}
                                        value={gcDiscount}
                                        onChange={(e) => setGcDiscount(Number(e.target.value))}
                                        className="h-8 px-2 text-center"
                                    />
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Discount applied to all GC type customers
                            </p>
                        </div>

                        <Separator />

                        {/* Designer Discount */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="designer-discount" className="text-base font-medium">
                                    Designer
                                </Label>
                                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                    {designerDiscount}% off
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <Slider
                                    id="designer-discount"
                                    min={0}
                                    max={50}
                                    step={1}
                                    value={[designerDiscount]}
                                    onValueChange={(value) => setDesignerDiscount(value[0])}
                                    className="flex-1"
                                />
                                <div className="w-16 text-right">
                                    <Input
                                        type="number"
                                        min={0}
                                        max={50}
                                        value={designerDiscount}
                                        onChange={(e) => setDesignerDiscount(Number(e.target.value))}
                                        className="h-8 px-2 text-center"
                                    />
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Discount applied to all Designer type customers
                            </p>
                        </div>

                        <Separator />

                        {/* Wholesale Discount */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="wholesale-discount" className="text-base font-medium">
                                    Wholesale
                                </Label>
                                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                    {wholesaleDiscount}% off
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <Slider
                                    id="wholesale-discount"
                                    min={0}
                                    max={50}
                                    step={1}
                                    value={[wholesaleDiscount]}
                                    onValueChange={(value) => setWholesaleDiscount(value[0])}
                                    className="flex-1"
                                />
                                <div className="w-16 text-right">
                                    <Input
                                        type="number"
                                        min={0}
                                        max={50}
                                        value={wholesaleDiscount}
                                        onChange={(e) => setWholesaleDiscount(Number(e.target.value))}
                                        className="h-8 px-2 text-center"
                                    />
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Discount applied to all Wholesale type customers
                            </p>
                        </div>

                        <Separator />

                        <div className="flex justify-end">
                            <Button onClick={handleSaveDiscountRates} disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Discount Rates'
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Points Rules */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-emerald-100">
                                <Coins className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <CardTitle>Points Rules</CardTitle>
                                <CardDescription>
                                    Configure how points are earned and redeemed
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Earn Rate */}
                        <div className="space-y-2">
                            <Label htmlFor="earn-rate" className="text-base font-medium">
                                Points Earn Rate
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="earn-rate"
                                    type="number"
                                    min={0}
                                    step={0.1}
                                    value={earnRate}
                                    onChange={(e) => setEarnRate(Number(e.target.value))}
                                    className="w-24"
                                />
                                <span className="text-muted-foreground">points per $1 spent</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                How many points customers earn for each dollar spent
                            </p>
                        </div>

                        <Separator />

                        {/* Redemption Rate */}
                        <div className="space-y-2">
                            <Label htmlFor="points-per-dollar" className="text-base font-medium">
                                Points Redemption Rate
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="points-per-dollar"
                                    type="number"
                                    min={1}
                                    value={pointsPerDollar}
                                    onChange={(e) => setPointsPerDollar(Number(e.target.value))}
                                    className="w-24"
                                />
                                <span className="text-muted-foreground">points = $1</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Example: {pointsPerDollar} points = $1, {pointsPerDollar * 10} points = $10
                            </p>
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={handleSavePointsConfig} disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Points Rules'
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Wholesale Program Settings */}
            <Card className="border-amber-200">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-amber-100">
                            <Store className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <CardTitle>Wholesale Program</CardTitle>
                            <CardDescription>
                                Special settings for wholesale customers including discount sharing and commission
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Discount Sharing Rules */}
                    <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                            <Percent className="h-4 w-4 text-amber-600" />
                            Discount Sharing Rules
                        </h4>
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Initial Share Discount */}
                            <div className="p-4 rounded-lg bg-amber-50 border border-amber-100 space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Initial Share Discount</Label>
                                    <span className="text-sm font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                                        {wholesaleInitialShareDiscount}%
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Slider
                                        min={5}
                                        max={50}
                                        step={1}
                                        value={[wholesaleInitialShareDiscount]}
                                        onValueChange={(value) => setWholesaleInitialShareDiscount(value[0])}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        min={5}
                                        max={50}
                                        value={wholesaleInitialShareDiscount}
                                        onChange={(e) => setWholesaleInitialShareDiscount(Number(e.target.value))}
                                        className="w-16 h-8 text-center"
                                    />
                                </div>
                                <p className="text-xs text-amber-600">
                                    Discount new wholesalers can share with others
                                </p>
                            </div>

                            {/* Upgraded Share Discount */}
                            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Upgraded Share Discount</Label>
                                    <span className="text-sm font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                        {wholesaleUpgradedShareDiscount}%
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Slider
                                        min={wholesaleInitialShareDiscount}
                                        max={50}
                                        step={1}
                                        value={[wholesaleUpgradedShareDiscount]}
                                        onValueChange={(value) => setWholesaleUpgradedShareDiscount(value[0])}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        min={wholesaleInitialShareDiscount}
                                        max={50}
                                        value={wholesaleUpgradedShareDiscount}
                                        onChange={(e) => setWholesaleUpgradedShareDiscount(Number(e.target.value))}
                                        className="w-16 h-8 text-center"
                                    />
                                </div>
                                <p className="text-xs text-emerald-600">
                                    Discount after reaching upgrade threshold
                                </p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Upgrade Threshold */}
                    <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-amber-600" />
                            Upgrade Threshold
                        </h4>
                        <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Total Order Value Threshold</Label>
                                <span className="text-sm font-medium text-foreground">
                                    ${wholesaleUpgradeThreshold.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="number"
                                    min={1000}
                                    step={500}
                                    value={wholesaleUpgradeThreshold}
                                    onChange={(e) => setWholesaleUpgradeThreshold(Number(e.target.value))}
                                    className="w-32"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                When wholesaler&apos;s own orders + referral orders reach this value, they upgrade to the higher share discount tier
                            </p>
                        </div>
                    </div>

                    <Separator />

                    {/* Commission Settings */}
                    <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-amber-600" />
                            Commission Settings
                        </h4>
                        <div className="p-4 rounded-lg bg-violet-50 border border-violet-100 space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Withdrawal Threshold</Label>
                                <span className="text-sm font-medium text-violet-700 bg-violet-100 px-2 py-0.5 rounded">
                                    ${wholesaleCommissionWithdrawThreshold}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <DollarSign className="h-4 w-4 text-violet-500" />
                                <Input
                                    type="number"
                                    min={50}
                                    step={50}
                                    value={wholesaleCommissionWithdrawThreshold}
                                    onChange={(e) => setWholesaleCommissionWithdrawThreshold(Number(e.target.value))}
                                    className="w-32"
                                />
                            </div>
                            <p className="text-xs text-violet-600">
                                Minimum commission balance required to withdraw. Below this, can only use as store credit.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={handleSaveWholesaleConfig} disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Wholesale Settings'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <SettingsIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-blue-900">How Settings Work</h4>
                            <ul className="mt-2 text-sm text-blue-700 space-y-1">
                                <li><strong>Customer Type Discounts:</strong> GC, Designer, and Wholesale customers automatically receive the configured discount on all orders.</li>
                                <li><strong>Points Earning:</strong> GC and Designer customers earn points based on the earn rate when orders are completed. Wholesale customers do NOT earn points.</li>
                                <li><strong>Points Redemption:</strong> Customers can redeem accumulated points for discounts on future orders.</li>
                                <li><strong>Wholesale Commission:</strong> Wholesalers earn commission (difference between their discount and shared discount) when others use their codes.</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
