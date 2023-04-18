import React from 'react';
import { Block, Labels } from '../../../../../fields/config/types';
import { Row } from '../rowReducer';
export declare const RowActions: React.FC<{
    addRow: (rowIndex: number, blockType: string) => void;
    duplicateRow: (rowIndex: number, blockType: string) => void;
    removeRow: (rowIndex: number) => void;
    moveRow: (fromIndex: number, toIndex: number) => void;
    labels: Labels;
    blocks: Block[];
    rowIndex: number;
    rows: Row[];
    blockType: string;
}>;
