import type { DrizzleAdapter, DrizzleTransaction } from '../types.js';
type Args = {
    adapter: DrizzleAdapter;
    db: DrizzleAdapter['drizzle'] | DrizzleTransaction;
    localeColumnName?: string;
    parentColumnName?: string;
    parentID: unknown;
    pathColumnName?: string;
    rows: Record<string, unknown>[];
    tableName: string;
};
export declare const deleteExistingRowsByPath: ({ adapter, db, localeColumnName, parentColumnName, parentID, pathColumnName, rows, tableName, }: Args) => Promise<void>;
export {};
//# sourceMappingURL=deleteExistingRowsByPath.d.ts.map