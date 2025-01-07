'use client'

import type { RelationshipFieldClientProps } from 'payload'

import { RelationshipField, useField } from '@payloadcms/ui'
import React from 'react'

type Props = {
  debug?: boolean
  serverValue?: number | string
  tenantsCollectionSlug: string
} & RelationshipFieldClientProps

export const TenantFieldClient = (args: Props) => {
  const { path, serverValue } = args

  const { setValue, value } = useField({ path })

  React.useEffect(() => {
    if (serverValue && value !== serverValue) {
      setValue(serverValue)
    }
  }, [serverValue, setValue, value])

  if (args.debug) {
    return (
      <RelationshipField
        field={{
          name: path,
          type: 'relationship',
          label: 'Tenant',
          relationTo: args.tenantsCollectionSlug,
          required: true,
        }}
        path={path}
      />
    )
  }

  return null
}
