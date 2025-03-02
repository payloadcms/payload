import type { PayloadRequest, Where } from 'payload'

import { SELECT_ALL } from '../constants.js'
import { getCollectionIDType } from '../utilities/getCollectionIDType.js'
import { getTenantFromCookie } from '../utilities/getTenantFromCookie.js'

type Args = {
  req: PayloadRequest
  tenantsCollectionSlug: string
}
export const filterTenantsBySelectedTenant = ({
  req,
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
    id: {
      equals: selectedTenant,
    },
  }
}
