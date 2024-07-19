'use client'
import { RelationshipField, useAuth, useFieldProps } from '@payloadcms/ui'
import React from 'react'

import type { User } from '../../../../payload-types.js'

export const TenantFieldComponent = () => {
  const { user } = useAuth<User>()
  const { path, readOnly } = useFieldProps()

  if (user) {
    if ((user.tenants && user.tenants.length > 1) || user?.roles?.includes('super-admin')) {
      return (
        <RelationshipField
          label="Tenant"
          name={path}
          path={path}
          readOnly={readOnly}
          relationTo="tenants"
          required
        />
      )
    }
  }
  return null
}
