import type { PayloadRequest, Where } from 'payload'

import { SELECT_ALL } from '../constants.js'
import { getCollectionIDType } from './getCollectionIDType.js'
import { getTenantFromCookie } from './getTenantFromCookie.js'

type Args = {
  req: PayloadRequest
  tenantFieldName: string
  tenantsCollectionSlug: string
}
export const getTenantListFilter = ({
  req,
  tenantFieldName,
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
    [tenantFieldName]: {
      equals: selectedTenant,
    },
  }
}
