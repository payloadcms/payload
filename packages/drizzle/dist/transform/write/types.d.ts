export type ArrayRowToInsert = {
    arrays: {
        [tableName: string]: ArrayRowToInsert[];
    };
    arraysToPush: {
        [tableName: string]: ArrayRowToInsert[];
    };
    locales: {
        [locale: string]: Record<string, unknown>;
    };
    row: Record<string, unknown>;
};
export type BlockRowToInsert = {
    arrays: {
        [tableName: string]: ArrayRowToInsert[];
    };
    arraysToPush: {
        [tableName: string]: ArrayRowToInsert[];
    };
    locales: {
        [locale: string]: Record<string, unknown>;
    };
    row: Record<string, unknown>;
};
export type RelationshipToDelete = {
    itemToRemove?: any;
    locale?: string;
    path: string;
    relationTo?: string;
};
export type RelationshipToAppend = {
    locale?: string;
    path: string;
    relationTo?: string;
    value: any;
};
export type TextToDelete = {
    locale?: string;
    path: string;
};
export type NumberToDelete = {
    locale?: string;
    path: string;
};
export type RowToInsert = {
    arrays: {
        [tableName: string]: ArrayRowToInsert[];
    };
    arraysToPush: {
        [tableName: string]: ArrayRowToInsert[];
    };
    blocks: {
        [tableName: string]: BlockRowToInsert[];
    };
    blocksToDelete: Set<string>;
    locales: {
        [locale: string]: Record<string, unknown>;
    };
    numbers: Record<string, unknown>[];
    numbersToDelete: NumberToDelete[];
    relationships: Record<string, unknown>[];
    relationshipsToAppend: RelationshipToAppend[];
    relationshipsToDelete: RelationshipToDelete[];
    row: Record<string, unknown>;
    selects: {
        [tableName: string]: Record<string, unknown>[];
    };
    texts: Record<string, unknown>[];
    textsToDelete: TextToDelete[];
};
//# sourceMappingURL=types.d.ts.map