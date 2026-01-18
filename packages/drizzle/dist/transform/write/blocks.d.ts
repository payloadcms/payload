import type { FlattenedBlocksField } from 'payload';
import type { DrizzleAdapter } from '../../types.js';
import type { BlockRowToInsert, NumberToDelete, RelationshipToDelete, TextToDelete } from './types.js';
type Args = {
    adapter: DrizzleAdapter;
    baseTableName: string;
    blocks: {
        [blockType: string]: BlockRowToInsert[];
    };
    blocksToDelete: Set<string>;
    data: Record<string, unknown>[];
    field: FlattenedBlocksField;
    locale?: string;
    numbers: Record<string, unknown>[];
    numbersToDelete: NumberToDelete[];
    parentIsLocalized: boolean;
    path: string;
    relationships: Record<string, unknown>[];
    relationshipsToDelete: RelationshipToDelete[];
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
export declare const transformBlocks: ({ adapter, baseTableName, blocks, blocksToDelete, data, field, locale, numbers, numbersToDelete, parentIsLocalized, path, relationships, relationshipsToDelete, selects, texts, textsToDelete, withinArrayOrBlockLocale, }: Args) => void;
export {};
//# sourceMappingURL=blocks.d.ts.map