import type { Tenant, UserWithTenantsField } from '../types.js'

import { defaults } from '../defaults.js'
import { extractID } from './extractID.js'

/**
 * Returns array of all tenant IDs assigned to a user
 *
 * @param user - User object with tenants field
 */
export const getUserTenantIDs = <IDType extends number | string>(
  user: null | UserWithTenantsField,
  options?: {
    tenantsArrayFieldName?: string
    tenantsArrayTenantFieldName?: string
  },
): IDType[] => {
  if (!user) {
    return []
  }

  const tenantsArrayFieldName = options?.tenantsArrayFieldName || defaults.tenantsArrayFieldName
  const tenantsArrayTenantFieldName =
    options?.tenantsArrayTenantFieldName || defaults.tenantsArrayTenantFieldName

  const tenantsArray = (user as Record<string, unknown>)[tenantsArrayFieldName]

  return (
    (Array.isArray(tenantsArray) ? tenantsArray : [])?.reduce<IDType[]>((acc, row) => {
      if (row[tenantsArrayTenantFieldName]) {
        acc.push(extractID<IDType>(row[tenantsArrayTenantFieldName] as Tenant<IDType>))
      }

      return acc
    }, []) || []
  )
}
