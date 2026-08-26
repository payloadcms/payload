/**
 * Default field names and constants for hierarchy feature
 * @internal
 */

export const HIERARCHY_SLUG_PATH_FIELD = '_h_slugPath'
/** @internal */
export const HIERARCHY_TITLE_PATH_FIELD = '_h_titlePath'
/** @internal */
export const HIERARCHY_DEFAULT_LOCALE = 'en'

/**
 * Default limit for hierarchy tree queries
 *
 * @internal
 */
export const DEFAULT_HIERARCHY_TREE_LIMIT = 100

/** Default limit for hierarchy list view table queries */
export const DEFAULT_HIERARCHY_LIST_LIMIT = 25

/**
 * Default value for allowing hasMany on hierarchy fields
 *
 * @internal
 */
export const DEFAULT_ALLOW_HAS_MANY = true

/**
 * Generate a hierarchy field name from a hierarchy slug (e.g., 'folders' -> '_h_folders')
 *
 * @internal
 */
export const getHierarchyFieldName = (hierarchySlug: string): string => `_h_${hierarchySlug}`
