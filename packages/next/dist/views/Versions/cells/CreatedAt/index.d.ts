import React from 'react';
export type CreatedAtCellProps = {
    collectionSlug?: string;
    docID?: number | string;
    globalSlug?: string;
    isTrashed?: boolean;
    rowData?: {
        id: number | string;
        updatedAt: Date | number | string;
    };
};
export declare const CreatedAtCell: React.FC<CreatedAtCellProps>;
//# sourceMappingURL=index.d.ts.map