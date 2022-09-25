type Hooks = 'afterUpdate' | 'afterDelete'

export interface CollectionOptions {
  slug: string
  webhook: string
  hooks: Hooks[]
}

export interface PluginOptions {
  collections: CollectionOptions[]
}
