import type { DrizzleAdapter, DrizzleTransaction } from '../types.js';
type Args = {
    adapter: DrizzleAdapter;
    db: DrizzleAdapter['drizzle'] | DrizzleTransaction;
    parentID: unknown;
    tableName: string;
};
export declare const deleteExistingArrayRows: ({ adapter, db, parentID, tableName, }: Args) => Promise<void>;
export {};
//# sourceMappingURL=deleteExistingArrayRows.d.ts.map