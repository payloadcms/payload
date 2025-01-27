import type { BaseListFilter, Where } from 'payload'

import { getTenantListFilter } from './getTenantListFilter.js'

type Args = {
  baseListFilter?: BaseListFilter
  tenantFieldName: string
  tenantsCollectionSlug: string
}
/**
 * Combines a base list filter with a tenant list filter
 *
 * Combines where constraints inside of an AND operator
 */
export const withTenantListFilter =
  ({ baseListFilter, tenantFieldName, tenantsCollectionSlug }: Args): BaseListFilter =>
  async (args) => {
    const filterConstraints = []

    if (typeof baseListFilter === 'function') {
      const baseListFilterResult = await baseListFilter(args)

      if (baseListFilterResult) {
        filterConstraints.push(baseListFilterResult)
      }
    }

    const tenantListFilter = getTenantListFilter({
      req: args.req,
      tenantFieldName,
      tenantsCollectionSlug,
    })

    if (tenantListFilter) {
      filterConstraints.push(tenantListFilter)
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
