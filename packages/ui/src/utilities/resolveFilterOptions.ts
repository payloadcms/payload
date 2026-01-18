import type { FilterOptions, FilterOptionsProps, ResolvedFilterOptions } from 'payload'

export const resolveFilterOptions = async (
  filterOptions: FilterOptions,
  options: { relationTo: string | string[] } & Omit<FilterOptionsProps, 'relationTo'>,
): Promise<ResolvedFilterOptions> => {
  const { relationTo } = options

  const relations = Array.isArray(relationTo) ? relationTo : [relationTo]

  const query = {}

  if (typeof filterOptions !== 'undefined') {
    await Promise.all(
      relations.map(async (relation) => {
        query[relation] =
          typeof filterOptions === 'function'
            ? await filterOptions({ ...options, relationTo: relation })
            : filterOptions

        if (query[relation] === true) {
          query[relation] = {}
        }

        // this is an ugly way to prevent results from being returned
        if (query[relation] === false) {
          query[relation] = { id: { exists: false } }
        }
      }),
    )
  }

  return query
}
