import type { FlattenedField } from 'payload';
import type { DrizzleAdapter } from '../../types.js';
import type { RowToInsert } from './types.js';
type Args = {
    adapter: DrizzleAdapter;
    data: Record<string, unknown>;
    enableAtomicWrites?: boolean;
    fields: FlattenedField[];
    parentIsLocalized?: boolean;
    path?: string;
    tableName: string;
};
export declare const transformForWrite: ({ adapter, data, enableAtomicWrites, fields, parentIsLocalized, path, tableName, }: Args) => RowToInsert;
export {};
//# sourceMappingURL=index.d.ts.map