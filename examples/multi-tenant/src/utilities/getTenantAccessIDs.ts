import type { Tenant, User } from '../payload-types'
import { extractID } from './extractID'

export const getTenantAccessIDs = (user: null | User): Tenant['id'][] => {
  if (!user) {
    return []
  }
  return (
    user?.tenants?.reduce<Tenant['id'][]>((acc, { tenant }) => {
      if (tenant) {
        acc.push(extractID(tenant))
      }
      return acc
    }, []) || []
  )
}

export const getTenantAdminTenantAccessIDs = (user: null | User): Tenant['id'][] => {
  if (!user) {
    return []
  }

  return (
    user?.tenants?.reduce<Tenant['id'][]>((acc, { roles, tenant }) => {
      if (roles.includes('tenant-admin') && tenant) {
        acc.push(extractID(tenant))
      }
      return acc
    }, []) || []
  )
}
