'use client'

import { useEffect, useRef } from 'react'
import { RelationshipField, useField } from '@payloadcms/ui'

type Props = {
  initialValue?: number
  path: string
  readOnly: boolean
}

export function TenantFieldComponentClient({ initialValue, path, readOnly }: Props) {
  const { formInitializing, setValue, value } = useField({ path })
  const hasSetInitialValue = useRef(false)

  useEffect(() => {
    if (!hasSetInitialValue.current && !formInitializing && initialValue && !value) {
      setValue(initialValue)
      hasSetInitialValue.current = true
    }
  }, [initialValue, setValue, formInitializing, value])

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
