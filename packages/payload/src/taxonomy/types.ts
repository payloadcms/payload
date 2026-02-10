import type { HierarchyConfig, SanitizedHierarchyConfig } from '../hierarchy/types.js'

/**
 * Configuration options for taxonomy feature
 *
 * Taxonomies are hierarchical collections that can be referenced by other collections.
 * They automatically use the hierarchy feature for parent-child relationships.
 */
export type TaxonomyConfig = {
  /**
   * Custom icon to display in the sidebar tab for this taxonomy
   * Provide a path to a React component (e.g., '@payloadcms/ui#FolderIcon')
   * If not provided, defaults to '@payloadcms/ui#TagIcon'
   */
  icon?: string
  /**
   * Collections that can reference this taxonomy.
   * Each entry specifies the collection slug and relationship configuration.
   * Payload will automatically inject a relationship field into each collection.
   *
   * @example
   * relatedCollections: {
   *   posts: { hasMany: true },   // Posts can have multiple tags
   *   pages: { hasMany: false },  // Pages have one category
   * }
   */
  relatedCollections?: {
    [collectionSlug: string]: {
      /** Whether documents can reference multiple taxonomy items. Default: false */
      hasMany?: boolean
    }
  }
  /**
   * Maximum number of children to load per parent node in the tree
   * Controls initial load and pagination for tree views
   * @default 100
   */
  treeLimit?: number
} & Partial<HierarchyConfig>

/**
 * Sanitized related collection info with computed field name
 */
export type SanitizedRelatedCollection = {
  /** Name of the injected relationship field */
  fieldName: string
  /** Whether the field allows multiple values */
  hasMany: boolean
}

/**
 * Sanitized taxonomy configuration with all defaults applied
 */
export type SanitizedTaxonomyConfig = {
  /**
   * Custom icon to display in the sidebar tab for this taxonomy
   */
  icon?: string
  /**
   * Related collections with their sanitized configuration.
   * Key is collection slug, value contains the injected field info.
   */
  relatedCollections: {
    [collectionSlug: string]: SanitizedRelatedCollection
  }
  /**
   * Maximum number of children to load per parent node in the tree
   * If not set, consumers will use DEFAULT_TAXONOMY_TREE_LIMIT (100)
   */
  treeLimit?: number
} & SanitizedHierarchyConfig
