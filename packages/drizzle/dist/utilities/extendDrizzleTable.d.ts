/**
 * Implemented from:
 * https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-orm/src/pg-core/table.ts#L73
 * Drizzle uses @internal JSDoc to remove their internal methods from types, for example
 * Table.Symbol, columnBuilder.build - but they actually exist.
 */
import type { ColumnBuilderBase } from 'drizzle-orm';
import { Table } from 'drizzle-orm';
type Args = {
    columns?: Record<string, ColumnBuilderBase<any>>;
    extraConfig?: (self: Record<string, any>) => object;
    table: Table;
};
/**
 * Extends the passed table with additional columns / extra config
 */
export declare const extendDrizzleTable: ({ columns, extraConfig, table }: Args) => void;
export {};
//# sourceMappingURL=extendDrizzleTable.d.ts.map