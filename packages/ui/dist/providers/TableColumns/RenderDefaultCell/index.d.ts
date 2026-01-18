import type { DefaultCellComponentProps } from 'payload';
import React from 'react';
import './index.scss';
export declare const useCellProps: () => DefaultCellComponentProps | null;
export declare const RenderDefaultCell: React.FC<{
    clientProps: DefaultCellComponentProps;
    columnIndex: number;
    enableRowSelections?: boolean;
    isLinkedColumn?: boolean;
}>;
//# sourceMappingURL=index.d.ts.map