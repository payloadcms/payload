/**
 * Configuration options for hierarchy feature
 */
export type HierarchyConfig = {
  /**
   * Name of the field that references the parent document
   * Will automatically create this field if it does not exist
   * (e.g., 'parent', 'parentPage', 'parentFolder')
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
   * Defaults to '_h_slugPath'
   */
  slugPathFieldName?: string
  /**
   * Name of the virtual field that will contain the title-based breadcrumb path
   * Defaults to '_h_titlePath'
   */
  titlePathFieldName?: string
}

/**
 * Sanitized hierarchy configuration with all defaults applied
 */
export type SanitizedHierarchyConfig = Required<HierarchyConfig>
