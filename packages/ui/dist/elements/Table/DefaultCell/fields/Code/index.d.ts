import type { ClientCollectionConfig, CodeFieldClient, DefaultCellComponentProps } from 'payload';
import React from 'react';
import './index.scss';
export interface CodeCellProps extends DefaultCellComponentProps<CodeFieldClient> {
    readonly collectionConfig: ClientCollectionConfig;
    readonly nowrap?: boolean;
}
export declare const CodeCell: React.FC<CodeCellProps>;
//# sourceMappingURL=index.d.ts.map