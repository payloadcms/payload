import type { Payload } from 'payload'

import { RelationshipField } from '@payloadcms/ui'
import React from 'react'

import type { MultiTenantPluginConfig, UserWithTenantsField } from '../../types.js'

export const TenantFieldRSC: React.FC<{
  path: string
  payload: Payload
  readOnly: boolean
  user: UserWithTenantsField
  userHasAccessToAllTenants: MultiTenantPluginConfig['userHasAccessToAllTenants']
}> = ({ path, readOnly, user, userHasAccessToAllTenants }) => {
  if (
    user &&
    ((Array.isArray(user.tenants) && user.tenants.length > 1) || userHasAccessToAllTenants(user))
  ) {
    return (
      <RelationshipField
        field={{
          name: path,
          type: 'relationship',
          label: 'Tenant',
          relationTo: 'tenants',
          required: true,
        }}
        path={path}
        readOnly={readOnly}
      />
    )
  }

  return null
}
