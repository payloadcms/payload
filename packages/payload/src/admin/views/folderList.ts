import type { ServerProps } from '../../config/types.js'
import type { FolderOrDocument } from '../../folders/types.js'
import type { SanitizedCollectionConfig } from '../../index.js'
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
  documents: FolderOrDocument[]
  subfolders: FolderOrDocument[]
} & ServerProps

export type FolderListViewServerProps = FolderListViewClientProps & FolderListViewServerPropsOnly

export type FolderListViewClientProps = {
  beforeActions?: React.ReactNode[]
  collectionSlug: SanitizedCollectionConfig['slug']
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  enableRowSelections?: boolean
  hasCreatePermission: boolean
  newDocumentURL: string
  viewPreference: 'grid' | 'list'
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
