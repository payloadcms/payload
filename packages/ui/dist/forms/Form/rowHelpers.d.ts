import type { Row } from 'payload';
export declare const extractRowsAndCollapsedIDs: ({ collapsed, rowID, rows, }: {
    collapsed: boolean;
    rowID: string;
    rows: Row[];
}) => {
    collapsedIDs: string[];
    updatedRows: Row[];
};
export declare const toggleAllRows: ({ collapsed, rows, }: {
    collapsed: any;
    rows: any;
}) => {
    collapsedIDs: string[];
    updatedRows: Row[];
};
//# sourceMappingURL=rowHelpers.d.ts.map