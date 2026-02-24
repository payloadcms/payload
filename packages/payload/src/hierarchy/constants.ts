/**
 * Default field names and constants for hierarchy feature
 */

export const HIERARCHY_SLUG_PATH_FIELD = '_h_slugPath'
export const HIERARCHY_TITLE_PATH_FIELD = '_h_titlePath'
export const HIERARCHY_DEFAULT_LOCALE = 'en'

/** Default limit for hierarchy tree queries */
export const DEFAULT_HIERARCHY_TREE_LIMIT = 100

/** Default value for allowing hasMany on hierarchy fields */
export const DEFAULT_ALLOW_HAS_MANY = true

/** Generate a hierarchy field name from a hierarchy slug (e.g., 'folders' -> '_h_folders') */
export const getHierarchyFieldName = (hierarchySlug: string): string => `_h_${hierarchySlug}`
