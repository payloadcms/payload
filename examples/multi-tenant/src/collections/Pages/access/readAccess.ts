import { parseCookies, type Access, type Where } from 'payload'

import { isSuperAdmin } from '@/access/isSuperAdmin'
import { getTenantAccessIDs } from '@/utilities/getTenantAccessIDs'
import { TENANT_COOKIE_NAME } from '@/collections/Tenants/cookie'

export const readAccess: Access = (args) => {
  const req = args.req
  const cookies = parseCookies(req.headers)
  const superAdmin = isSuperAdmin(args)
  const selectedTenant = cookies.get(TENANT_COOKIE_NAME)
  const tenantAccessIDs = getTenantAccessIDs(req.user)

  const publicPageConstraint: Where = {
    'tenant.public': {
      equals: true,
    },
  }

  // If it's a super admin or has access to the selected tenant
  if (
    selectedTenant &&
    (superAdmin || tenantAccessIDs.some((id) => String(id) === selectedTenant))
  ) {
    // filter access by selected tenant
    return {
      or: [
        publicPageConstraint,
        {
          tenant: {
            equals: selectedTenant,
          },
        },
      ],
    }
  }

  // If no manually selected tenant,
  // but it is a super admin, give access to all
  if (superAdmin) {
    return true
  }

  // If not super admin,
  // but has access to tenants,
  // give access to only their own tenants
  if (tenantAccessIDs.length) {
    return {
      or: [
        publicPageConstraint,
        {
          tenant: {
            in: tenantAccessIDs,
          },
        },
      ],
    }
  }

  // Allow access to public pages
  return publicPageConstraint
}
