import type { CollectionSlug, ErrorResult, GetFolderResultsComponentAndDataArgs, ServerFunction } from 'payload';
import type { FolderBreadcrumb, FolderOrDocument } from 'payload/shared';
type GetFolderResultsComponentAndDataResult = {
    breadcrumbs?: FolderBreadcrumb[];
    documents?: FolderOrDocument[];
    folderAssignedCollections?: CollectionSlug[];
    FolderResultsComponent: React.ReactNode;
    subfolders?: FolderOrDocument[];
};
type GetFolderResultsComponentAndDataErrorResult = {
    breadcrumbs?: never;
    documents?: never;
    FolderResultsComponent?: never;
    subfolders?: never;
} & ({
    message: string;
} | ErrorResult);
export declare const getFolderResultsComponentAndDataHandler: ServerFunction<GetFolderResultsComponentAndDataArgs, Promise<GetFolderResultsComponentAndDataErrorResult | GetFolderResultsComponentAndDataResult>>;
/**
 * This function is responsible for fetching folder data, building the results component
 * and returns the data and component together.
 */
export declare const getFolderResultsComponentAndData: ({ browseByFolder, collectionsToDisplay: activeCollectionSlugs, displayAs, folderAssignedCollections, folderID, req, sort, }: GetFolderResultsComponentAndDataArgs) => Promise<GetFolderResultsComponentAndDataResult>;
export {};
//# sourceMappingURL=getFolderResultsComponentAndData.d.ts.map