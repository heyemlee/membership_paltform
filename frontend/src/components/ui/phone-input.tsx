'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { formatPhoneInput, normalizePhone } from '@/lib/utils';
import { cn } from '@/lib/utils';

export interface PhoneInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value?: string;
    onChange?: (value: string) => void;
    onNormalizedChange?: (normalizedValue: string) => void;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
    ({ className, value = '', onChange, onNormalizedChange, ...props }, ref) => {
        const [displayValue, setDisplayValue] = React.useState(() => formatPhoneInput(value));

        // Update display value when prop value changes
        React.useEffect(() => {
            setDisplayValue(formatPhoneInput(value));
        }, [value]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const inputValue = e.target.value;
            const formatted = formatPhoneInput(inputValue);
            const normalized = normalizePhone(inputValue);

            setDisplayValue(formatted);

            // Call onChange with formatted value
            if (onChange) {
                onChange(formatted);
            }

            // Call onNormalizedChange with just digits (for storage)
            if (onNormalizedChange) {
                onNormalizedChange(normalized);
            }
        };

        return (
            <Input
                ref={ref}
                type="tel"
                inputMode="numeric"
                placeholder="(555) 123-4567"
                className={cn(className)}
                value={displayValue}
                onChange={handleChange}
                {...props}
            />
        );
    }
);

PhoneInput.displayName = 'PhoneInput';

export { PhoneInput };
