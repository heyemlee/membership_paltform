import { Badge } from '@/components/ui/badge';
import { CustomerType } from '@/types';

interface CustomerTypeBadgeProps {
    type: CustomerType;
}

const typeStyles: Record<CustomerType, string> = {
    GC: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    DESIGNER: 'bg-violet-100 text-violet-800 hover:bg-violet-100',
    REGULAR: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
    WHOLESALE: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
    OTHER: 'bg-slate-100 text-slate-800 hover:bg-slate-100',
};

const typeLabels: Record<CustomerType, string> = {
    GC: 'GC',
    DESIGNER: 'Designer',
    REGULAR: 'Regular',
    WHOLESALE: 'Wholesale',
    OTHER: 'Other',
};

export function CustomerTypeBadge({ type }: CustomerTypeBadgeProps) {
    return (
        <Badge className={typeStyles[type] || typeStyles.OTHER}>
            {typeLabels[type] || type}
        </Badge>
    );
}
