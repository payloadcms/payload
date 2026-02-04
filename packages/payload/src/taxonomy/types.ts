import type { HierarchyConfig, SanitizedHierarchyConfig } from '../hierarchy/types.js'

/**
 * Configuration options for taxonomy feature
 *
 * Taxonomies are hierarchical collections that can be referenced by other collections.
 * They automatically use the hierarchy feature for parent-child relationships.
 */
export type TaxonomyConfig = {
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
   * Array of collection slugs that can reference this taxonomy
   */
  relatedCollections: string[]
} & SanitizedHierarchyConfig
