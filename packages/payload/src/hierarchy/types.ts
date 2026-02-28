import type { PayloadComponent } from '../config/types.js'

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
       * Custom icon component for hierarchy items
       */
      Icon?: PayloadComponent
    }
    /**
     * Maximum number of items to load in tree views
     * @default 100
     */
    treeLimit?: number
    /**
     * Whether to use a header button for parent selection instead of inline field.
     * When true, the parent field is hidden and a button is injected into the document header.
     * Useful for folder-like hierarchies where the parent is selected via miller columns.
     * @default false
     */
    useHeaderButton?: boolean
  }
  /**
   * Whether related documents can have multiple values of this hierarchy
   * Set to false for folder-like behavior (single parent), true for tag-like behavior (multiple)
   * @default true
   */
  allowHasMany?: boolean
  /**
   * Whether this hierarchy is scoped to specific collections
   * When true or an object, hierarchy items can be restricted to certain collections
   * @default false
   */
  collectionSpecific?:
    | {
        /**
         * Name of the select field for specifying allowed collections
         * @default 'hierarchyType'
         */
        fieldName?: string
      }
    | boolean
  /**
   * Configure a join field to query all children (nested hierarchy items and related documents)
   * If not set, no join field is created
   */
  joinField?: {
    /** Name of the join field */
    fieldName: string
  }
  /**
   * Name of the field that references the parent document
   * Will automatically create this field if it does not exist
   * @default '_h_${collectionSlug}' (e.g., '_h_folders' for a collection with slug 'folders')
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
      Icon: PayloadComponent
    }
    treeLimit: number
    useHeaderButton: boolean
  }
  allowHasMany: boolean
  collectionSpecific:
    | {
        fieldName: string
      }
    | false
  /**
   * Join field configuration, or undefined if not enabled
   */
  joinField?: {
    fieldName: string
  }
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

/**
 * Client-safe hierarchy configuration (excludes functions that can't cross server-client boundary)
 */
export type ClientHierarchyConfig = Omit<SanitizedHierarchyConfig, 'slugify'>

/**
 * Breadcrumb item for folder hierarchies
 * @deprecated Use hierarchy breadcrumbs instead
 */
export type FolderBreadcrumb = {
  id: number | string
  name: string
}
