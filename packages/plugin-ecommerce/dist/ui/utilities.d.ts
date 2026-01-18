import type { Currency } from '../types/index.js';
/**
 * Convert display value with decimal point to base value (e.g., $25.00 to 2500)
 */
export declare const convertToBaseValue: ({ currency, displayValue, }: {
    currency: Currency;
    displayValue: string;
}) => number;
/**
 * Convert base value to display value with decimal point (e.g., 2500 to $25.00)
 */
export declare const convertFromBaseValue: ({ baseValue, currency, }: {
    baseValue: number;
    currency: Currency;
}) => string;
//# sourceMappingURL=utilities.d.ts.map