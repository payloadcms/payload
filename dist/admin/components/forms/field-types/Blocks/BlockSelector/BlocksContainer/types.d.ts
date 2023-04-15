import { Block } from '../../../../../../../fields/config/types';
export type Props = {
    blocks: Block[];
    close: () => void;
    addRow: (i: number, block: string) => void;
    addRowIndex: number;
};
