/**
 * Default field names and constants for taxonomy feature
 */

export const TAXONOMY_PARENT_FIELD = 'parent'
export const TAXONOMY_SLUG_PATH_FIELD = '_taxonomyPath'
export const TAXONOMY_TITLE_PATH_FIELD = '_taxonomyBreadcrumb'

/**
 * Generate the field name for a taxonomy relationship field
 * @param taxonomySlug - The slug of the taxonomy collection
 * @returns Field name like '_t_categories' or '_t_tags'
 */
export const getTaxonomyFieldName = (taxonomySlug: string): string => {
  return `_t_${taxonomySlug}`
}

/**
 * Default limit for taxonomy tree queries
 * This controls how many children are loaded per parent node
 */
export const DEFAULT_TAXONOMY_TREE_LIMIT = 100
