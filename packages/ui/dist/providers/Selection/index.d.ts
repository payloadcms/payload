import type { Where } from 'payload';
import React from 'react';
export declare enum SelectAllStatus {
    AllAvailable = "allAvailable",
    AllInPage = "allInPage",
    None = "none",
    Some = "some"
}
type SelectionContext = {
    count: number;
    disableBulkDelete?: boolean;
    disableBulkEdit?: boolean;
    getQueryParams: (additionalParams?: Where) => string;
    getSelectedIds: () => (number | string)[];
    selectAll: SelectAllStatus;
    selected: Map<number | string, boolean>;
    selectedIDs: (number | string)[];
    setSelection: (id: number | string) => void;
    /**
     * Selects all rows on the current page within the current query.
     * If `allAvailable` is true, does not select specific IDs so that the query itself affects all rows across all pages.
     */
    toggleAll: (allAvailable?: boolean) => void;
    totalDocs: number;
};
type Props = {
    readonly children: React.ReactNode;
    readonly docs: any[];
    readonly totalDocs: number;
};
export declare const SelectionProvider: React.FC<Props>;
export declare const useSelection: () => SelectionContext;
export {};
//# sourceMappingURL=index.d.ts.map