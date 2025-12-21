'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
    title: string;
    value: string | number;
    change?: number;
    icon: LucideIcon;
    loading?: boolean;
    className?: string;
    delay?: string;
}

export function StatsCard({ title, value, change, icon: Icon, loading, className, delay = '0ms' }: StatsCardProps) {
    if (loading) {
        return (
            <Card className="border-border/50 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-12 w-12 rounded-xl" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const isPositive = change && change > 0;
    const isNegative = change && change < 0;

    return (
        <Card
            className={cn(
                "border-border/50 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 group animate-in fade-in zoom-in-95",
                className
            )}
            style={{ animationDelay: delay, animationFillMode: 'both' }}
        >
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">{title}</p>
                        <h3 className="text-3xl font-bold tracking-tight text-foreground">{value}</h3>
                        {change !== undefined && (
                            <div className="flex items-center gap-1">
                                <span className={cn(
                                    "flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
                                    isPositive ? "bg-emerald-500/10 text-emerald-600" :
                                        isNegative ? "bg-red-500/10 text-red-600" : "bg-muted text-muted-foreground"
                                )}>
                                    {isPositive && '+'}
                                    {change.toFixed(1)}%
                                </span>
                                <span className="text-xs text-muted-foreground">from last month</span>
                            </div>
                        )}
                    </div>
                    <div className="p-3 rounded-xl bg-primary/5 group-hover:bg-primary/10 transition-colors">
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

