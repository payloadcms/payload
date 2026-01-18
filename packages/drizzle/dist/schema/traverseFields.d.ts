import type { FlattenedField } from 'payload';
import type { DrizzleAdapter, IDType, RawColumn, RawIndex, RelationMap, SetColumnID } from '../types.js';
type Args = {
    adapter: DrizzleAdapter;
    blocksTableNameMap: Record<string, number>;
    columnPrefix?: string;
    columns: Record<string, RawColumn>;
    disableNotNull: boolean;
    disableRelsTableUnique?: boolean;
    disableUnique?: boolean;
    fieldPrefix?: string;
    fields: FlattenedField[];
    forceLocalized?: boolean;
    indexes: Record<string, RawIndex>;
    localesColumns: Record<string, RawColumn>;
    localesIndexes: Record<string, RawIndex>;
    newTableName: string;
    parentIsLocalized: boolean;
    parentTableName: string;
    relationships: Set<string>;
    relationsToBuild: RelationMap;
    rootRelationsToBuild?: RelationMap;
    rootTableIDColType: IDType;
    rootTableName: string;
    setColumnID: SetColumnID;
    uniqueRelationships: Set<string>;
    versions: boolean;
    /**
     * Tracks whether or not this table is built
     * from the result of a localized array or block field at some point
     */
    withinLocalizedArrayOrBlock?: boolean;
};
type Result = {
    hasLocalizedField: boolean;
    hasLocalizedManyNumberField: boolean;
    hasLocalizedManyTextField: boolean;
    hasLocalizedRelationshipField: boolean;
    hasManyNumberField: 'index' | boolean;
    hasManyTextField: 'index' | boolean;
};
export declare const traverseFields: ({ adapter, blocksTableNameMap, columnPrefix, columns, disableNotNull, disableRelsTableUnique, disableUnique, fieldPrefix, fields, forceLocalized, indexes, localesColumns, localesIndexes, newTableName, parentIsLocalized, parentTableName, relationships, relationsToBuild, rootRelationsToBuild, rootTableIDColType, rootTableName, setColumnID, uniqueRelationships, versions, withinLocalizedArrayOrBlock, }: Args) => Result;
export {};
//# sourceMappingURL=traverseFields.d.ts.map