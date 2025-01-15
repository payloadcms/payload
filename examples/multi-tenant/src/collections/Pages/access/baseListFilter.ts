import { parseCookies, type BaseListFilter } from 'payload'

import { isSuperAdmin } from '@/access/isSuperAdmin'
import { getTenantAccessIDs } from '@/utilities/getTenantAccessIDs'
import { TENANT_COOKIE_NAME } from '@/collections/Tenants/cookie'

export const baseListFilter: BaseListFilter = (args) => {
  const req = args.req
  const cookies = parseCookies(req.headers)
  const superAdmin = isSuperAdmin(args)
  const selectedTenant = cookies.get(TENANT_COOKIE_NAME)
  const tenantAccessIDs = getTenantAccessIDs(req.user)

  // if user is super admin or has access to the selected tenant
  if (
    selectedTenant &&
    (superAdmin || tenantAccessIDs.some((id) => String(id) === selectedTenant))
  ) {
    // set a base filter for the list view
    return {
      tenant: {
        equals: selectedTenant,
      },
    }
  }

  // Access control will take it from here
  return null
}
