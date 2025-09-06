import type { CollectionConfig, TypeWithID } from '../collections/config/types.js'
import type { CollectionSlug, SanitizedCollectionConfig } from '../index.js'
import type { Document } from '../types/index.js'

export type FolderInterface = {
  documentsAndFolders?: {
    docs: {
      relationTo: CollectionSlug
      value: Document
    }[]
  }
  folder?: FolderInterface | (number | string | undefined)
  folderType: CollectionSlug[]
  name: string
} & TypeWithID

export type FolderBreadcrumb = {
  folderType?: CollectionSlug[]
  id: null | number | string
  name: string
}

export type Subfolder = {
  fileCount: number
  hasSubfolders: boolean
  id: number | string
  name: string
  subfolderCount: number
}

export type FolderEnabledColection = {
  admin: {
    custom: {
      folderCollectionSlug: CollectionSlug
    }
  }
  slug: CollectionSlug
} & SanitizedCollectionConfig

/**
 * `${relationTo}-${id}` is used as a key for the item
 */
export type FolderDocumentItemKey = `${string}-${number | string}`

/**
 * Needed for document card view for upload enabled collections
 */
type DocumentMediaData = {
  filename?: string
  mimeType?: string
  url?: string
}
/**
 * A generic structure for a folder or document item.
 */
export type FolderOrDocument = {
  itemKey: FolderDocumentItemKey
  relationTo: CollectionSlug
  value: {
    _folderOrDocumentTitle: string
    createdAt?: string
    folderID?: number | string
    folderType: CollectionSlug[]
    id: number | string
    updatedAt?: string
  } & DocumentMediaData
}

export type GetFolderDataResult = {
  breadcrumbs: FolderBreadcrumb[] | null
  documents: FolderOrDocument[]
  folderAssignedCollections: CollectionSlug[] | undefined
  subfolders: FolderOrDocument[]
}

export type RootFoldersConfiguration = {
  /**
   * If true, the browse by folder view will be enabled
   *
   * @default true
   */
  browseByFolder?: boolean
  /**
   * An array of functions to be ran when the folder collection is initialized
   * This allows plugins to modify the collection configuration
   */
  collectionOverrides?: (({
    collection,
  }: {
    collection: Omit<CollectionConfig, 'trash'>
  }) => Omit<CollectionConfig, 'trash'> | Promise<Omit<CollectionConfig, 'trash'>>)[]
  /**
   * If true, you can scope folders to specific collections.
   *
   * @default true
   */
  collectionSpecific?: boolean
  /**
   * Ability to view hidden fields and collections related to folders
   *
   * @default false
   */
  debug?: boolean
  /**
   * The Folder field name
   *
   * @default "folder"
   */
  fieldName?: string
  /**
   * Slug for the folder collection
   *
   * @default "payload-folders"
   */
  slug?: string
}

export type CollectionFoldersConfiguration = {
  /**
   * If true, the collection will be included in the browse by folder view
   *
   * @default true
   */
  browseByFolder?: boolean
}

type BaseFolderSortKeys = 'createdAt' | 'name' | 'updatedAt'

export type FolderSortKeys = `-${BaseFolderSortKeys}` | BaseFolderSortKeys
