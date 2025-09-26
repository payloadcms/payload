import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'

export type AddTreeViewFieldsArgs = {
  collectionConfig: CollectionConfig
  config: Config
  parentDocFieldName?: string
  slugify?: (text: string) => string
  slugPathFieldName?: string
  titlePathFieldName?: string
}
