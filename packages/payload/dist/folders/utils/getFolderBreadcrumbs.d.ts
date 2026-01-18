import type { PayloadRequest } from '../../types/index.js';
import type { FolderBreadcrumb } from '../types.js';
type GetFolderBreadcrumbsArgs = {
    breadcrumbs?: FolderBreadcrumb[];
    folderID?: number | string;
    req: PayloadRequest;
};
/**
 * Builds breadcrumbs up from child folder
 * all the way up to root folder
 */
export declare const getFolderBreadcrumbs: ({ breadcrumbs, folderID, req, }: GetFolderBreadcrumbsArgs) => Promise<FolderBreadcrumb[] | null>;
export {};
//# sourceMappingURL=getFolderBreadcrumbs.d.ts.map