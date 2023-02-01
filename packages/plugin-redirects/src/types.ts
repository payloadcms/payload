import { CollectionConfig } from "payload/types"

export type PluginConfig = {
  overrides?: Partial<CollectionConfig>
  collections?: string[]
}
