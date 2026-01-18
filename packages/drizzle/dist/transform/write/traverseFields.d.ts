import { type FlattenedField } from 'payload';
import type { DrizzleAdapter } from '../../types.js';
import type { NumberToDelete, RelationshipToAppend, RelationshipToDelete, RowToInsert, TextToDelete } from './types.js';
type Args = {
    adapter: DrizzleAdapter;
    /**
     * This will delete the array table and then re-insert all the new array rows.
     */
    arrays: RowToInsert['arrays'];
    /**
     * Array rows to push to the existing array. This will simply create
     * a new row in the array table.
     */
    arraysToPush: RowToInsert['arraysToPush'];
    /**
     * This is the name of the base table
     */
    baseTableName: string;
    blocks: RowToInsert['blocks'];
    blocksToDelete: Set<string>;
    /**
     * A snake-case field prefix, representing prior fields
     * Ex: my_group_my_named_tab_
     */
    columnPrefix: string;
    data: Record<string, unknown>;
    enableAtomicWrites?: boolean;
    existingLocales?: Record<string, unknown>[];
    /**
     * A prefix that will retain camel-case formatting, representing prior fields
     * Ex: myGroup_myNamedTab_
     */
    fieldPrefix: string;
    fields: FlattenedField[];
    forcedLocale?: string;
    /**
     * Tracks whether the current traversion context is from array or block.
     */
    insideArrayOrBlock?: boolean;
    locales: {
        [locale: string]: Record<string, unknown>;
    };
    numbers: Record<string, unknown>[];
    numbersToDelete: NumberToDelete[];
    parentIsLocalized: boolean;
    /**
     * This is the name of the parent table
     */
    parentTableName: string;
    path: string;
    relationships: Record<string, unknown>[];
    relationshipsToAppend: RelationshipToAppend[];
    relationshipsToDelete: RelationshipToDelete[];
    row: Record<string, unknown>;
    selects: {
        [tableName: string]: Record<string, unknown>[];
    };
    texts: Record<string, unknown>[];
    textsToDelete: TextToDelete[];
    /**
     * Set to a locale code if this set of fields is traversed within a
     * localized array or block field
     */
    withinArrayOrBlockLocale?: string;
};
export declare const traverseFields: ({ adapter, arrays, arraysToPush, baseTableName, blocks, blocksToDelete, columnPrefix, data, enableAtomicWrites, existingLocales, fieldPrefix, fields, forcedLocale, insideArrayOrBlock, locales, numbers, numbersToDelete, parentIsLocalized, parentTableName, path, relationships, relationshipsToAppend, relationshipsToDelete, row, selects, texts, textsToDelete, withinArrayOrBlockLocale, }: Args) => void;
export {};
//# sourceMappingURL=traverseFields.d.ts.map