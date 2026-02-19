import type { SingleRelationshipField } from '../fields/config/types.js'
import type { HierarchyConfig } from '../hierarchy/types.js'

/**
 * Options for creating a taxonomy relationship field.
 * All SingleRelationshipField properties are available except name, type, and relationTo
 * which are managed by the taxonomy system.
 */
export type CreateTaxonomyFieldOptions = {
  /**
   * The slug of the taxonomy collection this field references
   */
  taxonomySlug: string
} & Pick<Partial<SingleRelationshipField>, 'admin' | 'hasMany' | 'label' | 'required'>

/**
 * Configuration options for taxonomy feature
 *
 * Taxonomies are hierarchical collections that can be referenced by other collections.
 * They automatically use the hierarchy feature for parent-child relationships.
 *
 * Inherits hierarchy options (parentFieldName, slugPathFieldName, titlePathFieldName, slugify)
 * which are passed through to the underlying hierarchy configuration.
 */
export type TaxonomyConfig = {
  /**
   * Whether related collections can reference multiple terms from this taxonomy.
   * When true (default), documents can belong to multiple terms (tags behavior).
   * When false, documents can only belong to one term (folder behavior).
   * This setting overrides the hasMany option in createTaxonomyField().
   * @default true
   */
  allowHasMany?: boolean
  /**
   * Custom icon to display in the sidebar tab for this taxonomy
   * Provide a path to a React component (e.g., '@payloadcms/ui#FolderIcon')
   * If not provided, defaults to '@payloadcms/ui#TagIcon'
   */
  icon?: string
  /**
   * Maximum number of children to load per parent node in the tree
   * Controls initial load and pagination for tree views
   * @default 100
   */
  treeLimit?: number
} & Partial<HierarchyConfig>

/**
 * Sanitized related collection info with computed field name.
 */
export type SanitizedRelatedCollection = {
  /** Name of the taxonomy relationship field */
  fieldName: string
  /** Whether the field allows multiple values */
  hasMany: boolean
}

/**
 * Sanitized taxonomy configuration with all defaults applied
 */
export type SanitizedTaxonomyConfig = {
  /**
   * Whether related collections can reference multiple terms from this taxonomy.
   */
  allowHasMany: boolean
  /**
   * Custom icon to display in the sidebar tab for this taxonomy
   */
  icon?: string
  /**
   * Name of the field that references the parent taxonomy term.
   */
  parentFieldName: string
  /**
   * Related collections with their sanitized configuration.
   * Key is collection slug, value contains the field info.
   */
  relatedCollections: {
    [collectionSlug: string]: SanitizedRelatedCollection
  }
  /**
   * Maximum number of children to load per parent node in the tree
   * Controls initial load and pagination for tree views
   * @default 100
   */
  treeLimit?: number
}
