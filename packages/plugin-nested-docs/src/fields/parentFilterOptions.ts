import type { FilterOptions } from 'payload'

export const parentFilterOptions: (breadcrumbsFieldSlug?: string) => FilterOptions =
  (breadcrumbsFieldSlug = 'breadcrumbs') =>
  ({ id }) => {
    if (id) {
      return {
        id: { not_equals: id },
        [`${breadcrumbsFieldSlug}.doc`]: { not_in: [id] },
      }
    }

    return true
  }
