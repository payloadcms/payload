import type { CollectionConfig } from 'payload/types'

export interface PluginConfig {
  collections?: string[]
  overrides?: Partial<CollectionConfig>
}
