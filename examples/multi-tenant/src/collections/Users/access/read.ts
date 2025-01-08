import { parseCookies, type Access, type Where } from 'payload'
import type { User } from '@/payload-types'

import { isSuperAdmin } from '@/access/isSuperAdmin'
import { getTenantAdminTenantAccessIDs } from '@/utilities/getTenantAccessIDs'
import { TENANT_COOKIE_NAME } from '@/collections/Tenants/cookie'

export const readAccess: Access<User> = (args) => {
  const { req } = args
  if (!req?.user) {
    return false
  }

  const cookies = parseCookies(req.headers)
  const superAdmin = isSuperAdmin(args)
  const selectedTenant = cookies.get(TENANT_COOKIE_NAME)

  if (selectedTenant) {
    // If it's a super admin,
    // give them read access to only pages for that tenant
    if (superAdmin) {
      return {
        'tenants.tenant': {
          equals: selectedTenant,
        },
      }
    }

    const tenantAccessIDs = getTenantAdminTenantAccessIDs(req.user)
    const hasTenantAccess = tenantAccessIDs.some((id) => String(id) === selectedTenant)

    // If NOT super admin,
    // give them access only if they have access to tenant ID set in cookie
    if (hasTenantAccess) {
      return {
        'tenants.tenant': {
          equals: selectedTenant,
        },
      }
    }
  }

  if (superAdmin) {
    return true
  }

  const adminTenantAccessIDs = getTenantAdminTenantAccessIDs(req.user)

  return {
    'tenants.tenant': {
      in: adminTenantAccessIDs,
    },
  } as Where
}
