import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'
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
  documents: Document[]
}

export type RootTreeViewConfiguration = {}
