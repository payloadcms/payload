import type { BaseListFilter, Where } from 'payload'

type Args = {
  baseListFilter?: BaseListFilter
  customFilter: BaseListFilter
}
/**
 * Combines a base list filter with a tenant list filter
 *
 * Combines where constraints inside of an AND operator
 */
export const combineListFilters =
  ({ baseListFilter, customFilter }: Args): BaseListFilter =>
  async (args) => {
    const filterConstraints = []

    if (typeof baseListFilter === 'function') {
      const baseListFilterResult = await baseListFilter(args)

      if (baseListFilterResult) {
        filterConstraints.push(baseListFilterResult)
      }
    }

    const customFilterResult = await customFilter(args)

    if (customFilterResult) {
      filterConstraints.push(customFilterResult)
    }

    if (filterConstraints.length) {
      const combinedWhere: Where = { and: [] }
      filterConstraints.forEach((constraint) => {
        if (combinedWhere.and && constraint && typeof constraint === 'object') {
          combinedWhere.and.push(constraint)
        }
      })
      return combinedWhere
    }

    // Access control will take it from here
    return null
  }
