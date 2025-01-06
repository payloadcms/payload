import type { Tenant, UserWithTenantsField } from '../types.js'

import { extractID } from './extractID.js'

/**
 * Returns array of all tenant IDs assigned to a user
 *
 * @param user - User object with tenants field
 * @param role - Optional role to filter by
 */
export const getUserTenantIDs = <IDType extends number | string>(
  user: null | UserWithTenantsField,
  role?: string,
): IDType[] => {
  if (!user) {
    return []
  }

  return (
    user?.tenants?.reduce<IDType[]>((acc, { roles, tenant }) => {
      if (role && !roles.includes(role)) {
        return acc
      }

      if (tenant) {
        acc.push(extractID<IDType>(tenant as Tenant<IDType>))
      }

      return acc
    }, []) || []
  )
}
