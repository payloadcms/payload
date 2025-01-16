import type { PayloadRequest, Where } from 'payload'

import { SELECT_ALL } from '../constants.js'
import { getTenantFromCookie } from './getTenantFromCookie.js'

type Args = {
  req: PayloadRequest
  tenantFieldName: string
}
export const getTenantListFilter = ({ req, tenantFieldName }: Args): null | Where => {
  const selectedTenant = getTenantFromCookie(req.headers, req.payload.db.defaultIDType)

  if (selectedTenant === SELECT_ALL) {
    return {}
  }

  return {
    [tenantFieldName]: {
      equals: selectedTenant,
    },
  }
}
