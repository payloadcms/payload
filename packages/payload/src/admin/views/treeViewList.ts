import type { ServerProps } from '../../config/types.js'
import type { FolderBreadcrumb, FolderSortKeys } from '../../folders/types.js'
import type { SanitizedCollectionConfig } from '../../index.js'
import type { TreeViewItem } from '../../treeView/types.js'
export type TreeViewSlots = {
  AfterTreeViewList?: React.ReactNode
  AfterTreeViewListTable?: React.ReactNode
  BeforeTreeViewList?: React.ReactNode
  BeforeTreeViewListTable?: React.ReactNode
  Description?: React.ReactNode
  listMenuItems?: React.ReactNode[]
}

export type TreeViewServerPropsOnly = {
  collectionConfig: SanitizedCollectionConfig
  items: TreeViewItem[]
} & ServerProps

export type TreeViewServerProps = TreeViewClientProps & TreeViewServerPropsOnly

export type TreeViewClientProps = {
  beforeActions?: React.ReactNode[]
  breadcrumbs: FolderBreadcrumb[]
  collectionSlug?: SanitizedCollectionConfig['slug']
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  enableRowSelections?: boolean
  expandedItemIDs?: (number | string)[]
  items: TreeViewItem[]
  parentFieldName: string
  search?: string
  sort?: FolderSortKeys
  TreeViewComponent: React.ReactNode
} & TreeViewSlots

export type TreeViewSlotSharedClientProps = {
  collectionSlug: SanitizedCollectionConfig['slug']
  hasCreatePermission: boolean
  newDocumentURL: string
}

// BeforeTreeViewList
export type BeforeTreeViewListClientProps = TreeViewSlotSharedClientProps
export type BeforeTreeViewListServerPropsOnly = {} & TreeViewServerPropsOnly
export type BeforeTreeViewListServerProps = BeforeTreeViewListClientProps &
  BeforeTreeViewListServerPropsOnly

// BeforeTreeViewListTable
export type BeforeTreeViewListTableClientProps = TreeViewSlotSharedClientProps
export type BeforeTreeViewListTableServerPropsOnly = {} & TreeViewServerPropsOnly
export type BeforeTreeViewListTableServerProps = BeforeTreeViewListTableClientProps &
  BeforeTreeViewListTableServerPropsOnly

// AfterTreeViewList
export type AfterTreeViewListClientProps = TreeViewSlotSharedClientProps
export type AfterTreeViewListServerPropsOnly = {} & TreeViewServerPropsOnly
export type AfterTreeViewListServerProps = AfterTreeViewListClientProps &
  AfterTreeViewListServerPropsOnly

// AfterTreeViewListTable
export type AfterTreeViewListTableClientProps = TreeViewSlotSharedClientProps
export type AfterTreeViewListTableServerPropsOnly = {} & TreeViewServerPropsOnly
export type AfterTreeViewListTableServerProps = AfterTreeViewListTableClientProps &
  AfterTreeViewListTableServerPropsOnly
