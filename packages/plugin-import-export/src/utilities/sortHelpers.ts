/** Remove a leading '-' from a sort value (e.g. "-title" -> "title") */
export const stripSortDash = (v?: null | string): string => (v ? v.replace(/^-/, '') : '')

/** Apply order to a base field (("title","desc") -> "-title") */
export const applySortOrder = (field: string, order: 'asc' | 'desc'): string =>
  order === 'desc' ? `-${field}` : field
