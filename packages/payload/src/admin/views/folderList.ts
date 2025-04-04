import type { ServerProps } from '../../config/types.js'
import type {
  CollectionAdminOptions,
  CollectionSlug,
  ListPreferences,
  SanitizedCollectionConfig,
} from '../../index.js'
import type { ResolvedFilterOptions } from '../../types/index.js'
import type { Column } from '../elements/Table.js'
export type FolderListViewSlots = {
  AfterFolderList?: React.ReactNode
  AfterFolderListTable?: React.ReactNode
  BeforeFolderList?: React.ReactNode
  BeforeFolderListTable?: React.ReactNode
  Description?: React.ReactNode
  listMenuItems?: React.ReactNode[]
  Table: React.ReactNode
}

export type FolderListViewServerPropsOnly = {
  collectionConfig: SanitizedCollectionConfig
  documents: {
    relationTo: CollectionSlug
    value: any
  }[]
  limit: number
  listPreferences: ListPreferences
  listSearchableFields: CollectionAdminOptions['listSearchableFields']
  subfolders: {
    relationTo: CollectionSlug
    value: any
  }[]
} & ServerProps

export type FolderListViewServerProps = FolderListViewClientProps & FolderListViewServerPropsOnly

export type FolderListViewClientProps = {
  beforeActions?: React.ReactNode[]
  collectionSlug: SanitizedCollectionConfig['slug']
  columnState: Column[]
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  enableRowSelections?: boolean
  hasCreatePermission: boolean
  /**
   * @deprecated
   */
  listPreferences?: ListPreferences
  newDocumentURL: string
  /**
   * @deprecated
   */
  preferenceKey?: string
  renderedFilters?: Map<string, React.ReactNode>
  resolvedFilterOptions?: Map<string, ResolvedFilterOptions>
} & FolderListViewSlots

export type FolderListViewSlotSharedClientProps = {
  collectionSlug: SanitizedCollectionConfig['slug']
  hasCreatePermission: boolean
  newDocumentURL: string
}

// BeforeFolderList
export type BeforeFolderListClientProps = FolderListViewSlotSharedClientProps
export type BeforeFolderListServerPropsOnly = {} & FolderListViewServerPropsOnly
export type BeforeFolderListServerProps = BeforeFolderListClientProps &
  BeforeFolderListServerPropsOnly

// BeforeFolderListTable
export type BeforeFolderListTableClientProps = FolderListViewSlotSharedClientProps
export type BeforeFolderListTableServerPropsOnly = {} & FolderListViewServerPropsOnly
export type BeforeFolderListTableServerProps = BeforeFolderListTableClientProps &
  BeforeFolderListTableServerPropsOnly

// AfterFolderList
export type AfterFolderListClientProps = FolderListViewSlotSharedClientProps
export type AfterFolderListServerPropsOnly = {} & FolderListViewServerPropsOnly
export type AfterFolderListServerProps = AfterFolderListClientProps & AfterFolderListServerPropsOnly

// AfterFolderListTable
export type AfterFolderListTableClientProps = FolderListViewSlotSharedClientProps
export type AfterFolderListTableServerPropsOnly = {} & FolderListViewServerPropsOnly
export type AfterFolderListTableServerProps = AfterFolderListTableClientProps &
  AfterFolderListTableServerPropsOnly
