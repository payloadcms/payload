import type { Block } from '../fields/config/types.js';
import type { SelectMode, SelectType } from '../types/index.js';
/**
 * This is used for the Select API to determine the select level of a block.
 * It will ensure that `id` and `blockType` are always included in the select object.
 * @returns { blockSelect: boolean | SelectType, blockSelectMode: SelectMode }
 */
export declare const getBlockSelect: ({ block, select, selectMode, }: {
    block: Block;
    select: SelectType[string];
    selectMode: SelectMode;
}) => {
    blockSelect: boolean | SelectType;
    blockSelectMode: SelectMode;
};
//# sourceMappingURL=getBlockSelect.d.ts.map