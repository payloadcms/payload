import type { TypeWithID } from '../collections/config/types.js'
import type { CollectionSlug, SanitizedCollectionConfig } from '../index.js'
import type { Document } from '../types/index.js'

export type FolderInterface = {
  _folder?: FolderInterface | (number | string | undefined)
  documentsAndFolders?: {
    docs: {
      relationTo: CollectionSlug
      value: Document
    }[]
  }
  name: string
} & TypeWithID

export type FolderBreadcrumb = {
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
    _folder?: number | string
    _folderOrDocumentTitle: string
    createdAt?: string
    id: number | string
    updatedAt?: string
  } & DocumentMediaData
}

export type GetFolderDataResult = {
  breadcrumbs: FolderBreadcrumb[] | null
  documents: FolderOrDocument[]
  subfolders: FolderOrDocument[]
}
