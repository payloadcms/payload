import React from 'react';
import './index.scss';
type AutosaveCellProps = {
    currentlyPublishedVersion?: {
        id: number | string;
        updatedAt: string;
    };
    latestDraftVersion?: {
        id: number | string;
        updatedAt: string;
    };
    rowData: {
        autosave?: boolean;
        id: number | string;
        publishedLocale?: string;
        version: {
            _status: string;
        };
    };
};
export declare const AutosaveCell: React.FC<AutosaveCellProps>;
export {};
//# sourceMappingURL=index.d.ts.map