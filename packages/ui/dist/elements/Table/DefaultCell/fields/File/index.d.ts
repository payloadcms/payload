import type { ClientCollectionConfig, DefaultCellComponentProps, TextFieldClient, UploadFieldClient } from 'payload';
import React from 'react';
import './index.scss';
export interface FileCellProps extends DefaultCellComponentProps<TextFieldClient | UploadFieldClient> {
    readonly collectionConfig: ClientCollectionConfig;
}
export declare const FileCell: React.FC<FileCellProps>;
//# sourceMappingURL=index.d.ts.map