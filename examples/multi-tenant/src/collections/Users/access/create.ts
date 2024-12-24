import type { Access, PayloadRequest } from 'payload'

import type { User } from '../../../payload-types'

import { isSuperAdmin } from '../../../access/isSuperAdmin'
import { getTenantAdminTenantAccessIDs } from '../../../utilities/getTenantAccessIDs'

export const createAccess: Access<User> = (args) => {
  const { req, data }: { req: PayloadRequest; data?: User } = args
  if (!req.user) {
    return false
  }

  if (isSuperAdmin(args)) {
    return true
  }

  const adminTenantAccessIDs = getTenantAdminTenantAccessIDs(req.user)

  if (!data) {
    // Triggered by visit to the User collection on Admin console
    // If we return true, then this enables the "Create New" button
    // so, we do that if we're an admin of at least 1 tenant
    return Boolean(adminTenantAccessIDs.length)
  }

  if (data.roles?.includes('super-admin')) {
    // No escalation of privs.
    return false
  }

  if (data.tenants && data.tenants.length === 0) {
    // Gotta have at least 1 tenant
    return false
  }

  // allow only if the tenants are where this user is an admin.
  return !!data.tenants?.every((tenant) =>
    adminTenantAccessIDs.includes(
      typeof tenant.tenant === 'string' ? tenant.tenant : tenant.tenant.id,
    ),
  )
}
