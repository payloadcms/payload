import type { Access, Where } from 'payload'

import { parseCookies } from 'payload'

import { isSuperAdmin } from '../../../access/isSuperAdmin'
import { getTenantAccessIDs } from '../../../utilities/getTenantAccessIDs'

export const externalReadAccess: Access = (args) => {
  const req = args.req
  const cookies = parseCookies(req.headers)
  const superAdmin = isSuperAdmin(args)
  const selectedTenant = cookies.get('payload-tenant')
  const tenantAccessIDs = getTenantAccessIDs(req.user)

  const publicPageConstraint: Where = {
    'tenant.public': {
      equals: true,
    },
  }

  // First check for manually selected tenant from cookies
  if (selectedTenant) {
    // If it's a super admin,
    // give them read access to only pages for that tenant
    if (superAdmin) {
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

    const hasTenantAccess = tenantAccessIDs.some((id) => id === selectedTenant)

    // If NOT super admin,
    // give them access only if they have access to tenant ID set in cookie
    if (hasTenantAccess) {
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
