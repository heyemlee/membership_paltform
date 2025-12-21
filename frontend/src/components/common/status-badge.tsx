import { Badge } from '@/components/ui/badge';

type StatusType = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'DRAFT' | 'SCHEDULED' | 'SENT';

interface StatusBadgeProps {
    status: StatusType;
}

const statusStyles: Record<StatusType, string> = {
    PENDING: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
    COMPLETED: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
    CANCELLED: 'bg-red-100 text-red-800 hover:bg-red-100',
    DRAFT: 'bg-slate-100 text-slate-800 hover:bg-slate-100',
    SCHEDULED: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    SENT: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
};

export function StatusBadge({ status }: StatusBadgeProps) {
    return (
        <Badge className={statusStyles[status] || statusStyles.PENDING}>
            {status}
        </Badge>
    );
}
