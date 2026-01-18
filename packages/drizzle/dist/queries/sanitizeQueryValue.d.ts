import type { SQL } from 'drizzle-orm';
import { type Field, type TabAsField } from 'payload';
import type { DrizzleAdapter } from '../types.js';
type SanitizeQueryValueArgs = {
    adapter: DrizzleAdapter;
    columns?: {
        idType: 'number' | 'text' | 'uuid';
        rawColumn: SQL<unknown>;
    }[];
    field: Field | TabAsField;
    isUUID: boolean;
    operator: string;
    relationOrPath: string;
    val: any;
};
type SanitizedColumn = {
    rawColumn: SQL<unknown>;
    value: unknown;
};
export declare const sanitizeQueryValue: ({ adapter, columns, field, isUUID, operator: operatorArg, relationOrPath, val, }: SanitizeQueryValueArgs) => {
    columns?: SanitizedColumn[];
    operator: string;
    value: unknown;
};
export {};
//# sourceMappingURL=sanitizeQueryValue.d.ts.map