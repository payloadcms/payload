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
   * Array of collection slugs that can reference this taxonomy
   * If not provided, all collections with relationships to this taxonomy will be auto-detected
   */
  relatedCollections?: string[]
} & Partial<HierarchyConfig>

/**
 * Sanitized taxonomy configuration with all defaults applied
 */
export type SanitizedTaxonomyConfig = {
  /**
   * Custom icon to display in the sidebar tab for this taxonomy
   */
  icon?: string
  /**
   * Array of collection slugs that can reference this taxonomy
   */
  relatedCollections: string[]
} & SanitizedHierarchyConfig
