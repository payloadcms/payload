import type { SQL } from 'drizzle-orm';
import type { SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core';
import type { FlattenedField } from 'payload';
import { type PgTableWithColumns } from 'drizzle-orm/pg-core';
import type { DrizzleAdapter, GenericColumn } from '../types.js';
import type { BuildQueryJoinAliases } from './buildQuery.js';
type Constraint = {
    columnName: string;
    table: PgTableWithColumns<any> | SQLiteTableWithColumns<any>;
    value: unknown;
};
type TableColumn = {
    columnName?: string;
    columns?: {
        idType: 'number' | 'text' | 'uuid';
        rawColumn: SQL<unknown>;
    }[];
    constraints: Constraint[];
    field: FlattenedField;
    getNotNullColumnByValue?: (val: unknown) => string;
    pathSegments?: string[];
    rawColumn?: SQL;
    table: PgTableWithColumns<any> | SQLiteTableWithColumns<any>;
};
type Args = {
    adapter: DrizzleAdapter;
    aliasTable?: PgTableWithColumns<any> | SQLiteTableWithColumns<any>;
    collectionPath: string;
    columnPrefix?: string;
    constraintPath?: string;
    constraints?: Constraint[];
    fields: FlattenedField[];
    joins: BuildQueryJoinAliases;
    locale?: string;
    parentAliasTable?: PgTableWithColumns<any> | SQLiteTableWithColumns<any>;
    parentIsLocalized: boolean;
    pathSegments: string[];
    rootTableName?: string;
    selectFields: Record<string, GenericColumn>;
    selectLocale?: boolean;
    tableName: string;
    /**
     * If creating a new table name for arrays and blocks, this suffix should be appended to the table name
     */
    tableNameSuffix?: string;
    /**
     * The raw value of the query before sanitization
     */
    value: unknown;
};
/**
 * Transforms path to table and column name or to a list of OR columns
 * Adds tables to `join`
 * @returns TableColumn
 */
export declare const getTableColumnFromPath: ({ adapter, aliasTable, collectionPath, columnPrefix, constraintPath: incomingConstraintPath, constraints, fields, joins, locale: incomingLocale, parentAliasTable, parentIsLocalized, pathSegments: incomingSegments, rootTableName: incomingRootTableName, selectFields, selectLocale, tableName, tableNameSuffix, value, }: Args) => TableColumn;
export {};
//# sourceMappingURL=getTableColumnFromPath.d.ts.map