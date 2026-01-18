import type { AdminViewServerProps, BuildCollectionFolderViewResult, ListQuery } from 'payload';
export type BuildCollectionFolderViewStateArgs = {
    disableBulkDelete?: boolean;
    disableBulkEdit?: boolean;
    enableRowSelections: boolean;
    folderID?: number | string;
    isInDrawer?: boolean;
    overrideEntityVisibility?: boolean;
    query: ListQuery;
} & AdminViewServerProps;
/**
 * Builds the entire view for collection-folder views on the server
 */
export declare const buildCollectionFolderView: (args: BuildCollectionFolderViewStateArgs) => Promise<BuildCollectionFolderViewResult>;
//# sourceMappingURL=buildView.d.ts.map