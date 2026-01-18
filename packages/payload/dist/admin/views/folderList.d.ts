import type { ServerProps } from '../../config/types.js';
import type { FolderBreadcrumb, FolderOrDocument, FolderSortKeys } from '../../folders/types.js';
import type { SanitizedCollectionConfig } from '../../index.js';
export type FolderListViewSlots = {
    AfterFolderList?: React.ReactNode;
    AfterFolderListTable?: React.ReactNode;
    BeforeFolderList?: React.ReactNode;
    BeforeFolderListTable?: React.ReactNode;
    Description?: React.ReactNode;
    listMenuItems?: React.ReactNode[];
};
export type FolderListViewServerPropsOnly = {
    collectionConfig: SanitizedCollectionConfig;
    documents: FolderOrDocument[];
    subfolders: FolderOrDocument[];
} & ServerProps;
export type FolderListViewServerProps = FolderListViewClientProps & FolderListViewServerPropsOnly;
export type FolderListViewClientProps = {
    activeCollectionFolderSlugs?: SanitizedCollectionConfig['slug'][];
    allCollectionFolderSlugs: SanitizedCollectionConfig['slug'][];
    allowCreateCollectionSlugs: SanitizedCollectionConfig['slug'][];
    baseFolderPath: `/${string}`;
    beforeActions?: React.ReactNode[];
    breadcrumbs: FolderBreadcrumb[];
    collectionSlug?: SanitizedCollectionConfig['slug'];
    disableBulkDelete?: boolean;
    disableBulkEdit?: boolean;
    documents: FolderOrDocument[];
    enableRowSelections?: boolean;
    folderAssignedCollections?: SanitizedCollectionConfig['slug'][];
    folderFieldName: string;
    folderID: null | number | string;
    FolderResultsComponent: React.ReactNode;
    search?: string;
    sort?: FolderSortKeys;
    subfolders: FolderOrDocument[];
    viewPreference: 'grid' | 'list';
} & FolderListViewSlots;
export type FolderListViewSlotSharedClientProps = {
    collectionSlug: SanitizedCollectionConfig['slug'];
    hasCreatePermission: boolean;
    newDocumentURL: string;
};
export type BeforeFolderListClientProps = FolderListViewSlotSharedClientProps;
export type BeforeFolderListServerPropsOnly = {} & FolderListViewServerPropsOnly;
export type BeforeFolderListServerProps = BeforeFolderListClientProps & BeforeFolderListServerPropsOnly;
export type BeforeFolderListTableClientProps = FolderListViewSlotSharedClientProps;
export type BeforeFolderListTableServerPropsOnly = {} & FolderListViewServerPropsOnly;
export type BeforeFolderListTableServerProps = BeforeFolderListTableClientProps & BeforeFolderListTableServerPropsOnly;
export type AfterFolderListClientProps = FolderListViewSlotSharedClientProps;
export type AfterFolderListServerPropsOnly = {} & FolderListViewServerPropsOnly;
export type AfterFolderListServerProps = AfterFolderListClientProps & AfterFolderListServerPropsOnly;
export type AfterFolderListTableClientProps = FolderListViewSlotSharedClientProps;
export type AfterFolderListTableServerPropsOnly = {} & FolderListViewServerPropsOnly;
export type AfterFolderListTableServerProps = AfterFolderListTableClientProps & AfterFolderListTableServerPropsOnly;
//# sourceMappingURL=folderList.d.ts.map