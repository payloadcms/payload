import type { CollectionSlug, TypeWithID } from 'payload'

export interface FolderInterface {
  createdAt: string
  id: string
  name: string
  parentFolder?: FolderInterface | null
  prefix?: null | string
  updatedAt: string
}

export type Subfolder = {
  fileCount: number
  hasSubfolders: boolean
  id: number | string
  name: string
  subfolderCount: number
}

export type PolymorphicRelationshipValue = {
  relationTo: string
  value: number | string | TypeWithID
}

export type MoveItemType = PolymorphicRelationshipValue

export type ItemKey = `${string}-${number | string}`

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
  itemKey: ItemKey
  relationTo: CollectionSlug
  value: {
    _parentFolder?: number | string
    createdAt: string
    id: string
    title: string
    updatedAt: string
  } & DocumentMediaData
}

export type FolderSubfolders = FolderOrDocument[]
export type FolderDocuments = FolderOrDocument[]
