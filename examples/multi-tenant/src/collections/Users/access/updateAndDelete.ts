import type { Access } from 'payload'

import { isSuperAdmin } from '../../../access/isSuperAdmin'
import { getTenantAdminTenantAccessIDs } from '../../../utilities/getTenantAccessIDs'
import { User } from '@/payload-types'

export const updateAndDeleteAccess: Access = (args) => {
  const { req, data }: { req: any; data: User } = args

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

  // If you're only a tenant-admin, then you can't delete super-admins
  if (data.roles?.includes('super-admin')) {
    return false
  }

  // Can delete a user, only if you're an admin in *all* of their tenants
  return data.tenants?.every((tenant) =>
    adminTenantAccessIDs.includes(
      typeof tenant.tenant === 'string' ? tenant.tenant : tenant.tenant.id,
    ),
  )
}
