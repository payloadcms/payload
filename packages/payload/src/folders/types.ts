import type { TypeWithID } from '../collections/config/types.js'
import type { CollectionSlug, SanitizedCollectionConfig } from '../index.js'

export type FolderInterface = {
  name: string
  parentFolder?: FolderInterface | (null | string)
  prefix?: string
} & TypeWithID

export type Breadcrumb = {
  id?: number | string
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

export type BreadcrumbsAndSubfolders = {
  breadcrumbs: Breadcrumb[]
  subfolders: Subfolder[]
}
