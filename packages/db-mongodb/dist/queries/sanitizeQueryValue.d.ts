import type { FlattenedField, Operator, Payload } from 'payload';
type SanitizeQueryValueArgs = {
    field: FlattenedField;
    hasCustomID: boolean;
    locale?: string;
    operator: Operator;
    parentIsLocalized: boolean;
    path: string;
    payload: Payload;
    val: any;
};
export declare const sanitizeQueryValue: ({ field, hasCustomID, locale, operator, parentIsLocalized, path, payload, val, }: SanitizeQueryValueArgs) => {
    operator?: string;
    rawQuery?: unknown;
    val?: unknown;
} | undefined;
export {};
//# sourceMappingURL=sanitizeQueryValue.d.ts.map