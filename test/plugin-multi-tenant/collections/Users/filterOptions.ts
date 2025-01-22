import type { FilterOptions, Where } from 'payload'

import { getTenantFromCookie } from '@payloadcms/plugin-multi-tenant/utilities'

export const userFilterOptions: FilterOptions = ({ req }) => {
  const selectedTenant = getTenantFromCookie(req.headers, req.payload.db.defaultIDType)
  if (!selectedTenant) {
    return false
  }

  return {
    or: [
      {
        'tenants.tenant': {
          equals: selectedTenant,
        },
      },
      {
        roles: {
          in: ['admin'],
        },
      },
    ],
  } as Where
}
