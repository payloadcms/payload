import type { NumberField } from 'payload';
type Args = {
    field: NumberField;
    locale?: string;
    numberRows: Record<string, unknown>[];
    ref: Record<string, unknown>;
    withinArrayOrBlockLocale?: string;
};
export declare const transformHasManyNumber: ({ field, locale, numberRows, ref, withinArrayOrBlockLocale, }: Args) => void;
export {};
//# sourceMappingURL=hasManyNumber.d.ts.map