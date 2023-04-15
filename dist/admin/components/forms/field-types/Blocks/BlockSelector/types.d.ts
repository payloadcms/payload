import { Block } from '../../../../../../fields/config/types';
export type Props = {
    blocks: Block[];
    addRow: (index: number, blockType?: string) => void;
    watchParentHover?: boolean;
    parentIsHovered?: boolean;
    close: () => void;
    addRowIndex: number;
};
