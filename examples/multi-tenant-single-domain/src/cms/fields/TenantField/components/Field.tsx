'use client'
import React from 'react'

import { useAuth, RelationshipField, useFieldProps } from '@payloadcms/ui'
import { User } from 'payload/generated-types'

export const TenantFieldComponent = () => {
  const { user } = useAuth<User>()
  const { path, readOnly } = useFieldProps()

  if (user) {
    if ((user.tenants && user.tenants.length > 1) || user?.roles?.includes('super-admin')) {
      return (
        <RelationshipField
          name={path}
          path={path}
          relationTo="tenants"
          label="Tenant"
          readOnly={readOnly}
          required
        />
      )
    }
  }
  return null
}
