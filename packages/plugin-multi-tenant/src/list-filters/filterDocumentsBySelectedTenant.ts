import type { PayloadRequest, Where } from 'payload'

import { getCollectionIDType } from '../utilities/getCollectionIDType.js'
import { getTenantFromCookie } from '../utilities/getTenantFromCookie.js'

type Args = {
  req: PayloadRequest
  tenantFieldName: string
  tenantsCollectionSlug: string
}
export const filterDocumentsBySelectedTenant = ({
  req,
  tenantFieldName,
  tenantsCollectionSlug,
}: Args): null | Where => {
  const idType = getCollectionIDType({
    collectionSlug: tenantsCollectionSlug,
    payload: req.payload,
  })
  const selectedTenant = getTenantFromCookie(req.headers, idType)

  if (selectedTenant) {
    return {
      [tenantFieldName]: {
        equals: selectedTenant,
      },
    }
  }

  return {}
}
