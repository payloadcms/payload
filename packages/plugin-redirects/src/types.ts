import type { CollectionConfig } from 'payload/types'

export interface PluginConfig {
  overrides?: Partial<CollectionConfig>
  collections?: string[]
}
