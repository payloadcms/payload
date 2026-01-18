import type { PgTableWithColumns } from 'drizzle-orm/pg-core';
import type { SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core';
import type { DrizzleAdapter } from '../types.js';
type Table = PgTableWithColumns<any> | SQLiteTableWithColumns<any>;
export declare const getTableAlias: ({ adapter, tableName, }: {
    adapter: DrizzleAdapter;
    tableName: string;
}) => {
    newAliasTable: Table;
    newAliasTableName: string;
};
export {};
//# sourceMappingURL=getTableAlias.d.ts.map