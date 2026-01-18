import type { TextField } from 'payload';
type Args = {
    field: TextField;
    locale?: string;
    ref: Record<string, unknown>;
    textRows: Record<string, unknown>[];
    withinArrayOrBlockLocale?: string;
};
export declare const transformHasManyText: ({ field, locale, ref, textRows, withinArrayOrBlockLocale, }: Args) => void;
export {};
//# sourceMappingURL=hasManyText.d.ts.map