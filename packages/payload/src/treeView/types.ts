import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'
import type { CollectionSlug } from '../index.js'
import type { Document } from '../types/index.js'

export type AddTreeViewFieldsArgs = {
  collectionConfig: CollectionConfig
  config: Config
  parentDocFieldName?: string
  slugify?: (text: string) => string
  slugPathFieldName?: string
  titlePathFieldName?: string
}

export type GetTreeViewDataResult = {
  documents: TreeViewDocument[]
}

export type RootTreeViewConfiguration = {}

/** `${relationTo}-${id}` is used as a key for the item */
export type TreeViewItemKey = `${string}-${number | string}`

export type TreeViewDocument = {
  itemKey: TreeViewItemKey
  relationTo: CollectionSlug
  value: {
    createdAt?: string
    id: number | string
    parentDocIDs?: (number | string)[]
    parentID?: number | string
    title: string
    updatedAt?: string
  }
}
