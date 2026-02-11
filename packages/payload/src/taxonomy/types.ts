import type { SingleRelationshipField } from '../fields/config/types.js'
import type { HierarchyConfig, SanitizedHierarchyConfig } from '../hierarchy/types.js'

/**
 * Field overrides for taxonomy relationship fields.
 * Allows customizing the injected relationship field except for name, type, and relationTo
 * which are managed by the taxonomy system.
 */
export type TaxonomyRelationshipFieldOverrides = Omit<
  Partial<SingleRelationshipField>,
  'name' | 'relationTo' | 'type'
>

/**
 * Configuration for a related collection in taxonomy
 */
export type TaxonomyRelatedCollectionConfig = {
  /**
   * Overrides for the injected relationship field.
   * Allows customizing hasMany, label, admin, filterOptions, etc.
   *
   * @example
   * fieldOverrides: {
   *   hasMany: true,
   *   label: 'Categories',
   *   admin: { position: 'sidebar' },
   * }
   */
  fieldOverrides?: TaxonomyRelationshipFieldOverrides
}

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
   *   posts: {
   *     fieldOverrides: { hasMany: true }  // Posts can have multiple tags
   *   },
   *   pages: {
   *     fieldOverrides: { hasMany: false } // Pages have one category
   *   },
   * }
   */
  relatedCollections?: {
    [collectionSlug: string]: TaxonomyRelatedCollectionConfig
  }
  /**
   * Maximum number of children to load per parent node in the tree
   * Controls initial load and pagination for tree views
   * @default 100
   */
  treeLimit?: number
} & Partial<HierarchyConfig>

/**
 * Sanitized related collection info with computed field name.
 * Extends the user config with computed values.
 */
export type SanitizedRelatedCollection = {
  /** Name of the injected relationship field */
  fieldName: string
  /** Original field overrides from user config */
  fieldOverrides?: TaxonomyRelationshipFieldOverrides
  /** Whether the field allows multiple values (computed from fieldOverrides.hasMany) */
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
