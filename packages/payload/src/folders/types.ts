import type { TypeWithID } from '../collections/config/types.js'
import type { CollectionSlug, SanitizedCollectionConfig } from '../index.js'

export type FolderInterface = {
  _parentFolder?: FolderInterface | (number | string | undefined)
  isRoot?: boolean
  name: string
} & TypeWithID

export type FolderBreadcrumb = {
  id: number | string
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

export type GetFolderDataResult<DocType = TypeWithID> = {
  breadcrumbs: FolderBreadcrumb[]
  items: {
    relationTo: string
    value: DocType | number | string
  }[]
}
