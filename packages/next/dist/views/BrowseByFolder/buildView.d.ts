import type { AdminViewServerProps, BuildCollectionFolderViewResult, ListQuery } from 'payload';
export type BuildFolderViewArgs = {
    customCellProps?: Record<string, any>;
    disableBulkDelete?: boolean;
    disableBulkEdit?: boolean;
    enableRowSelections: boolean;
    folderID?: number | string;
    isInDrawer?: boolean;
    overrideEntityVisibility?: boolean;
    query: ListQuery;
} & AdminViewServerProps;
export declare const buildBrowseByFolderView: (args: BuildFolderViewArgs) => Promise<BuildCollectionFolderViewResult>;
//# sourceMappingURL=buildView.d.ts.map