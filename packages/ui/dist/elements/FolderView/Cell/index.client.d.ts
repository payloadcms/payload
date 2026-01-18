import type { Data, ViewTypes } from 'payload';
import React from 'react';
type Props = {
    readonly collectionSlug: string;
    readonly data: Data;
    readonly docTitle: string;
    readonly folderCollectionSlug: string;
    readonly folderFieldName: string;
    readonly viewType?: ViewTypes;
};
export declare const FolderTableCellClient: ({ collectionSlug, data, docTitle, folderCollectionSlug, folderFieldName, viewType, }: Props) => React.JSX.Element;
export {};
//# sourceMappingURL=index.client.d.ts.map