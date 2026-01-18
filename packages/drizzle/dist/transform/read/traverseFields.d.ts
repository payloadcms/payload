import type { FlattenedField, JoinQuery, SanitizedConfig } from 'payload';
import type { DrizzleAdapter } from '../../types.js';
import type { BlocksMap } from '../../utilities/createBlocksMap.js';
type TraverseFieldsArgs = {
    /**
     * The DB adapter
     */
    adapter: DrizzleAdapter;
    /**
     * Pre-formatted blocks map
     */
    blocks: BlocksMap;
    /**
     * The full Payload config
     */
    config: SanitizedConfig;
    currentTableName: string;
    /**
     * The data reference to be mutated within this recursive function
     */
    dataRef: Record<string, unknown>;
    /**
     * Data that needs to be removed from the result after all fields have populated
     */
    deletions: (() => void)[];
    /**
     * Column prefix can be built up by group and named tab fields
     */
    fieldPrefix: string;
    /**
     * An array of Payload fields to traverse
     */
    fields: FlattenedField[];
    /**
     *
     */
    joinQuery?: JoinQuery;
    /**
     * All hasMany number fields, as returned by Drizzle, keyed on an object by field path
     */
    numbers: Record<string, Record<string, unknown>[]>;
    parentIsLocalized: boolean;
    /**
     * The current field path (in dot notation), used to merge in relationships
     */
    path: string;
    /**
     * All related documents, as returned by Drizzle, keyed on an object by field path
     */
    relationships: Record<string, Record<string, unknown>[]>;
    /**
     * Data structure representing the nearest table from db
     */
    table: Record<string, unknown>;
    tablePath: string;
    /**
     * All hasMany text fields, as returned by Drizzle, keyed on an object by field path
     */
    texts: Record<string, Record<string, unknown>[]>;
    topLevelTableName: string;
    /**
     * Set to a locale if this group of fields is within a localized array or block.
     */
    withinArrayOrBlockLocale?: string;
};
export declare const traverseFields: <T extends Record<string, unknown>>({ adapter, blocks, config, currentTableName, dataRef, deletions, fieldPrefix, fields, joinQuery, numbers, parentIsLocalized, path, relationships, table, tablePath, texts, topLevelTableName, withinArrayOrBlockLocale, }: TraverseFieldsArgs) => T;
export {};
//# sourceMappingURL=traverseFields.d.ts.map