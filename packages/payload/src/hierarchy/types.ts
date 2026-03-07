/**
 * Configuration options for hierarchy feature
 *
 * Hierarchies are always self-referential - documents can only nest under other documents
 * from the same collection.
 */
export type HierarchyConfig = {
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
  parentFieldName: string
  slugify: (text: string) => string
  slugPathFieldName: string
  titlePathFieldName: string
}
