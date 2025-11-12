import type { PayloadRequest, TypedUser, Where } from 'payload'

import type { MultiTenantPluginConfig } from '../types.js'

import { defaults } from '../defaults.js'
import { getCollectionIDType } from '../utilities/getCollectionIDType.js'
import { getTenantFromCookie } from '../utilities/getTenantFromCookie.js'
import { getUserTenantIDs } from '../utilities/getUserTenantIDs.js'

type Args<ConfigType = unknown> = {
  /**
   * If the document this filter is run belongs to a tenant, the tenant ID should be passed here.
   * If set, this will be used instead of the tenant cookie
   */
  docTenantID?: number | string
  filterFieldName: string
  req: PayloadRequest
  tenantsArrayFieldName?: string
  tenantsArrayTenantFieldName?: string
  tenantsCollectionSlug: string
  userHasAccessToAllTenants: Required<
    MultiTenantPluginConfig<ConfigType>
  >['userHasAccessToAllTenants']
}
export const filterDocumentsByTenants = <ConfigType = unknown>({
  docTenantID,
  filterFieldName,
  req,
  tenantsArrayFieldName = defaults.tenantsArrayFieldName,
  tenantsArrayTenantFieldName = defaults.tenantsArrayTenantFieldName,
  tenantsCollectionSlug,
  userHasAccessToAllTenants,
}: Args<ConfigType>): null | Where => {
  const idType = getCollectionIDType({
    collectionSlug: tenantsCollectionSlug,
    payload: req.payload,
  })

  // scope results to selected tenant
  const selectedTenant = docTenantID ?? getTenantFromCookie(req.headers, idType)
  if (selectedTenant) {
    return {
      [filterFieldName]: {
        in: [selectedTenant],
      },
    }
  }

  if (
    req.user &&
    userHasAccessToAllTenants(
      req?.user as ConfigType extends { user: unknown } ? ConfigType['user'] : TypedUser,
    )
  ) {
    return null
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
