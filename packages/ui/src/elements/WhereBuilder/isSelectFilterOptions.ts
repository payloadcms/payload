import type { Option, ResolvedListFilterOptions } from 'payload'

/**
 * Narrows a resolved `filterOptions` value: `select` fields resolve to an `Option[]`,
 * while `relationship`/`upload` fields resolve to a `Where` query per related collection.
 */
export const isSelectFilterOptions = (
  filterOptions: ResolvedListFilterOptions | undefined,
): filterOptions is Option[] => Array.isArray(filterOptions)
