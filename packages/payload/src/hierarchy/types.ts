/**
 * Configuration options for hierarchy feature
 *
 * Hierarchies are always self-referential - documents can only nest under other documents
 * from the same collection.
 */
export type HierarchyConfig = {
  /**
   * UI configuration for hierarchy
   */
  admin?: {
    /**
     * Custom components for hierarchy UI
     */
    components?: {
      /**
       * Custom icon component path for hierarchy items
       */
      Icon?: string
    }
    /**
     * Maximum number of items to load in tree views
     * @default 100
     */
    treeLimit?: number
  }
  /**
   * Whether related documents can have multiple values of this hierarchy
   * Set to false for folder-like behavior (single parent), true for tag-like behavior (multiple)
   * @default true
   */
  allowHasMany?: boolean
  /**
   * Whether this hierarchy is scoped to specific collections
   * When true, hierarchy items can be restricted to certain collections
   * @default false
   */
  collectionSpecific?: boolean
  /**
   * Name of the field that references the parent document
   * Will automatically create this field if it does not exist
   * @default HIERARCHY_PARENT_FIELD ('_h_parent')
   */
  parentFieldName: string
  /**
   * Custom function to slugify text for path generation
   * Used by computeSlugPath() utility for generating slug-based breadcrumb paths
   * Defaults to internal slugify implementation
   */
  slugify?: (text: string) => string
  /**
   * Name of the virtual field that will contain the slug-based breadcrumb path
   * @default HIERARCHY_SLUG_PATH_FIELD ('_h_slugPath')
   */
  slugPathFieldName?: string
  /**
   * Name of the virtual field that will contain the title-based breadcrumb path
   * @default HIERARCHY_TITLE_PATH_FIELD ('_h_titlePath')
   */
  titlePathFieldName?: string
}

/**
 * Sanitized hierarchy configuration with all defaults applied
 */
export type SanitizedHierarchyConfig = {
  admin: {
    components: {
      Icon?: string
    }
    treeLimit: number
  }
  allowHasMany: boolean
  collectionSpecific: boolean
  parentFieldName: string
  /**
   * Auto-populated during validation - maps collection slug to field info
   */
  relatedCollections: Record<string, SanitizedHierarchyRelatedCollection>
  slugify: (text: string) => string
  slugPathFieldName: string
  titlePathFieldName: string
}

/**
 * Information about how a collection relates to this hierarchy
 */
export type SanitizedHierarchyRelatedCollection = {
  fieldName: string
  hasMany: boolean
}
