import { parseCookies, type Access } from 'payload'
import type { Page } from '@/payload-types'

import { TENANT_COOKIE_NAME } from '@/collections/Tenants/cookie'
import { getTenantAccessIDs } from '@/utilities/getTenantAccessIDs'
import { isSuperAdmin } from '@/access/isSuperAdmin'
import { extractID } from '@/utilities/extractID'
import { tenantUserRole } from '@/collections/Users/roles'

export const filterByTenantRead: Access<Page> = (args) => {
  const req = args.req
  const cookies = parseCookies(req.headers)
  const superAdmin = isSuperAdmin(args)
  const selectedTenant = cookies.get(TENANT_COOKIE_NAME)

  const tenantAccessIDs = getTenantAccessIDs(req.user)

  // First check for manually selected tenant from cookies
  if (selectedTenant) {
    // If it's a super admin,
    // give them read access to only pages for that tenant
    if (superAdmin) {
      return {
        tenant: {
          equals: selectedTenant,
        },
      }
    }

    const hasTenantAccess = tenantAccessIDs.some((id) => String(id) === selectedTenant)

    // If NOT super admin,
    // give them access only if they have access to tenant ID set in cookie
    if (hasTenantAccess) {
      return {
        tenant: {
          equals: selectedTenant,
        },
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
      tenant: {
        in: tenantAccessIDs,
      },
    }
  }

  // Deny access to all others
  return false
}

export const canMutatePage: Access<Page> = (args) => {
  const req = args.req
  const superAdmin = isSuperAdmin(args)

  if (!req.user) {
    return false
  }

  // super admins can mutate pages for any tenant
  if (superAdmin) {
    return true
  }

  const cookies = parseCookies(req.headers)
  const selectedTenant = cookies.get(TENANT_COOKIE_NAME)

  if (!selectedTenant) {
    // No access if no tenant is set and user is not a super admin
    return false
  }

  const selectedTenantID = Number.parseInt(selectedTenant, 10)

  // tenant admins can add/delete/update
  // pages they have access to
  return (
    req.user?.tenants?.reduce((hasAccess: boolean, accessRow) => {
      if (hasAccess) {
        return true
      }

      const accessRowTenantId = extractID(accessRow.tenant)

      if (
        accessRow &&
        accessRowTenantId === selectedTenantID &&
        accessRow.roles?.includes(tenantUserRole.TENANT_ADMIN)
      ) {
        return true
      }
      return hasAccess
    }, false) || false
  )
}
