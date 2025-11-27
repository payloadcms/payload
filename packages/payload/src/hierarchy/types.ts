export type HierarchyDataT = {
  _h_parentTree?: (number | string)[] | null
  slugPath?: Record<string, string> | string
  titlePath?: Record<string, string> | string
}

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
   * Defaults to internal slugify implementation
   */
  slugify?: (text: string) => string
  /**
   * Name of the field to store the slugified breadcrumb path
   * @default '_h_slugPath'
   */
  slugPathFieldName?: string
  /**
   * Name of the field to store the title breadcrumb path
   * @default '_h_titlePath'
   */
  titlePathFieldName?: string
}

/**
 * Sanitized hierarchy configuration with all defaults applied
 */
export type SanitizedHierarchyConfig = {
  slugify?: (text: string) => string
} & Required<Omit<HierarchyConfig, 'slugify'>>
