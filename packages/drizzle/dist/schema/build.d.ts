import type { FlattenedField, SanitizedCompoundIndex } from 'payload';
import type { DrizzleAdapter, IDType, RawColumn, RawForeignKey, RawIndex, RelationMap, SetColumnID } from '../types.js';
type Args = {
    adapter: DrizzleAdapter;
    baseColumns?: Record<string, RawColumn>;
    /**
     * After table is created, run these functions to add extra config to the table
     * ie. indexes, multiple columns, etc
     */
    baseForeignKeys?: Record<string, RawForeignKey>;
    /**
     * After table is created, run these functions to add extra config to the table
     * ie. indexes, multiple columns, etc
     */
    baseIndexes?: Record<string, RawIndex>;
    blocksTableNameMap: Record<string, number>;
    buildNumbers?: boolean;
    buildRelationships?: boolean;
    compoundIndexes?: SanitizedCompoundIndex[];
    disableNotNull: boolean;
    disableRelsTableUnique?: boolean;
    disableUnique: boolean;
    fields: FlattenedField[];
    parentIsLocalized: boolean;
    rootRelationships?: Set<string>;
    rootRelationsToBuild?: RelationMap;
    rootTableIDColType?: IDType;
    rootTableName?: string;
    rootUniqueRelationships?: Set<string>;
    setColumnID: SetColumnID;
    tableName: string;
    timestamps?: boolean;
    versions: boolean;
    /**
     * Tracks whether or not this table is built
     * from the result of a localized array or block field at some point
     */
    withinLocalizedArrayOrBlock?: boolean;
};
type Result = {
    hasLocalizedManyNumberField: boolean;
    hasLocalizedManyTextField: boolean;
    hasLocalizedRelationshipField: boolean;
    hasManyNumberField: 'index' | boolean;
    hasManyTextField: 'index' | boolean;
    relationsToBuild: RelationMap;
};
export declare const buildTable: ({ adapter, baseColumns, baseForeignKeys, baseIndexes, blocksTableNameMap, compoundIndexes, disableNotNull, disableRelsTableUnique, disableUnique, fields, parentIsLocalized, rootRelationships, rootRelationsToBuild, rootTableIDColType, rootTableName: incomingRootTableName, rootUniqueRelationships, setColumnID, tableName, timestamps, versions, withinLocalizedArrayOrBlock, }: Args) => Result;
export {};
//# sourceMappingURL=build.d.ts.map