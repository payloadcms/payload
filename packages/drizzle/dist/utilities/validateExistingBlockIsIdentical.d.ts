import type { Block, FlattenedBlock } from 'payload';
import type { RawTable } from '../types.js';
type Args = {
    block: Block;
    localized: boolean;
    /**
     * @todo make required in v4.0. Usually you'd wanna pass this in
     */
    parentIsLocalized?: boolean;
    rootTableName: string;
    table: RawTable;
    tableLocales?: RawTable;
};
/**
 * returns true if all the fields in a block are identical to the existing table
 */
export declare const validateExistingBlockIsIdentical: ({ block, localized, parentIsLocalized, table, tableLocales, }: Args) => boolean;
export declare const InternalBlockTableNameIndex: unique symbol;
export declare const setInternalBlockIndex: (block: FlattenedBlock, index: number) => void;
export declare const resolveBlockTableName: (block: FlattenedBlock, originalTableName: string) => string;
export {};
//# sourceMappingURL=validateExistingBlockIsIdentical.d.ts.map