import type { CollectionConfig } from 'payload/types'

export type RedirectsPluginConfig = {
  collections?: string[]
  overrides?: Partial<CollectionConfig>
}
