import type { ClientCollectionConfig, ViewTypes, Where } from 'payload';
import React from 'react';
export type ListSelectionProps = {
    collectionConfig?: ClientCollectionConfig;
    disableBulkDelete?: boolean;
    disableBulkEdit?: boolean;
    label: string;
    modalPrefix?: string;
    showSelectAllAcrossPages?: boolean;
    viewType?: ViewTypes;
    where?: Where;
};
export declare const ListSelection: React.FC<ListSelectionProps>;
//# sourceMappingURL=index.d.ts.map