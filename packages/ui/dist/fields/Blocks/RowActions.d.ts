import type { ClientBlock, ClientField, Labels } from 'payload';
import React from 'react';
export declare const RowActions: React.FC<{
    readonly addRow: (rowIndex: number, blockType: string) => Promise<void> | void;
    readonly blocks: (ClientBlock | string)[];
    readonly blockType: string;
    readonly copyRow: (rowIndex: number) => void;
    readonly duplicateRow: (rowIndex: number, blockType: string) => void;
    readonly fields: ClientField[];
    readonly hasMaxRows?: boolean;
    readonly isSortable?: boolean;
    readonly labels: Labels;
    readonly moveRow: (fromIndex: number, toIndex: number) => void;
    readonly pasteRow: (rowIndex: number) => void;
    readonly removeRow: (rowIndex: number) => void;
    readonly rowCount: number;
    readonly rowIndex: number;
}>;
//# sourceMappingURL=RowActions.d.ts.map