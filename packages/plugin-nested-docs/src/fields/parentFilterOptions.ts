import type { FilterOptions } from 'payload/dist/fields/config/types'

export const parentFilterOptions: (breadcrumbsFieldSlug?: string) => FilterOptions =
  (breadcrumbsFieldSlug = 'breadcrumbs') =>
  ({ id }) => {
    if (id) {
      return {
        id: { not_equals: id },
        [`${breadcrumbsFieldSlug}.doc`]: { not_in: [id] },
      }
    }

    return null
  }

export default parentFilterOptions
