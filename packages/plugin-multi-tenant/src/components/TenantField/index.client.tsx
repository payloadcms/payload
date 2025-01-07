'use client'

import type { RelationshipFieldClientProps } from 'payload'

import { useField } from '@payloadcms/ui'
import React from 'react'

type Props = {
  serverValue?: number | string
} & RelationshipFieldClientProps

export const TenantFieldClient = (args: Props) => {
  const { path, serverValue } = args

  const { setValue, value } = useField({ path })

  React.useEffect(() => {
    if (serverValue && value !== serverValue) {
      setValue(serverValue)
    }
  }, [serverValue, setValue, value])

  return null
}
