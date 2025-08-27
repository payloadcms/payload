import type { PayloadRequest, Where } from 'payload'

import { defaults } from '../defaults.js'
import { getCollectionIDType } from '../utilities/getCollectionIDType.js'
import { getTenantFromCookie } from '../utilities/getTenantFromCookie.js'
import { getUserTenantIDs } from '../utilities/getUserTenantIDs.js'

type Args = {
  filterFieldName: string
  req: PayloadRequest
  tenantsArrayFieldName?: string
  tenantsArrayTenantFieldName?: string
  tenantsCollectionSlug: string
}
export const filterDocumentsByTenants = ({
  filterFieldName,
  req,
  tenantsArrayFieldName = defaults.tenantsArrayFieldName,
  tenantsArrayTenantFieldName = defaults.tenantsArrayTenantFieldName,
  tenantsCollectionSlug,
}: Args): null | Where => {
  const idType = getCollectionIDType({
    collectionSlug: tenantsCollectionSlug,
    payload: req.payload,
  })

  // scope results to selected tenant
  const selectedTenant = getTenantFromCookie(req.headers, idType)
  if (selectedTenant) {
    return {
      [filterFieldName]: {
        in: [selectedTenant],
      },
    }
  }

  // scope to user assigned tenants
  const userAssignedTenants = getUserTenantIDs(req.user, {
    tenantsArrayFieldName,
    tenantsArrayTenantFieldName,
  })
  if (userAssignedTenants.length > 0) {
    return {
      [filterFieldName]: {
        in: userAssignedTenants,
      },
    }
  }

  // no tenant selected and no user tenants, return null to allow access control to handle it
  return null
}
