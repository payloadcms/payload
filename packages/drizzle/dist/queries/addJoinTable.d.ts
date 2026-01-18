import { type SQL } from 'drizzle-orm';
import { type PgTableWithColumns } from 'drizzle-orm/pg-core';
import type { GenericTable } from '../types.js';
import type { BuildQueryJoinAliases } from './buildQuery.js';
export declare const addJoinTable: ({ type, condition, joins, queryPath, table, }: {
    condition: SQL;
    joins: BuildQueryJoinAliases;
    queryPath?: string;
    table: GenericTable | PgTableWithColumns<any>;
    type?: "innerJoin" | "leftJoin" | "rightJoin";
}) => void;
//# sourceMappingURL=addJoinTable.d.ts.map