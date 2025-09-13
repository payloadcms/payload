import type { CollectionConfig } from '../collections/config/types.js'

export type RootHierarchyConfiguration = {
  /**
   * An array of functions to be ran when the hierarchy collection is initialized
   * This allows plugins to modify the collection configuration
   */
  collectionOverrides?: (({
    collection,
  }: {
    collection: Omit<CollectionConfig, 'trash'>
  }) => Omit<CollectionConfig, 'trash'> | Promise<Omit<CollectionConfig, 'trash'>>)[]
  /**
   * Ability to view hidden fields and collections related to the hierarchy
   *
   * @default false
   */
  debug?: boolean
  /**
   * The hierarchical parent field name
   *
   * @default "hierarchicalParent"
   */
  fieldName?: string
  /**
   * Slug for the hierarchy collection
   *
   * @default "payload-hierarchy"
   */
  slug?: string
}

export type HierarchyCollectionConfig = {
  hierarchy?: boolean
}
