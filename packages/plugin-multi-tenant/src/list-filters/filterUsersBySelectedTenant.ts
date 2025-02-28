import type { PayloadRequest, Where } from 'payload'

import { SELECT_ALL } from '../constants.js'
import { getCollectionIDType } from '../utilities/getCollectionIDType.js'
import { getTenantFromCookie } from '../utilities/getTenantFromCookie.js'

type Args = {
  req: PayloadRequest
  tenantsArrayFieldName: string
  tenantsArrayTenantFieldName: string
  tenantsCollectionSlug: string
}
/**
 * Filter the list of users by the selected tenant
 */
export const filterUsersBySelectedTenant = ({
  req,
  tenantsArrayFieldName,
  tenantsArrayTenantFieldName,
  tenantsCollectionSlug,
}: Args): null | Where => {
  const idType = getCollectionIDType({
    collectionSlug: tenantsCollectionSlug,
    payload: req.payload,
  })
  const selectedTenant = getTenantFromCookie(req.headers, idType)

  if (selectedTenant === SELECT_ALL) {
    return {}
  }

  return {
    [`${tenantsArrayFieldName}.${tenantsArrayTenantFieldName}`]: {
      in: [selectedTenant],
    },
  }
}
