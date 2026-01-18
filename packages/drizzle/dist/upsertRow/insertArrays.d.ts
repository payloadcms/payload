import type { ArrayRowToInsert } from '../transform/write/types.js';
import type { DrizzleAdapter, DrizzleTransaction } from '../types.js';
type Args = {
    adapter: DrizzleAdapter;
    arrays: {
        [tableName: string]: ArrayRowToInsert[];
    }[];
    db: DrizzleAdapter['drizzle'] | DrizzleTransaction;
    parentRows: Record<string, unknown>[];
    uuidMap?: Record<string, number | string>;
};
export declare const insertArrays: ({ adapter, arrays, db, parentRows, uuidMap, }: Args) => Promise<void>;
export {};
//# sourceMappingURL=insertArrays.d.ts.map