'use client'
import { RelationshipField, useField } from '@payloadcms/ui'
import React from 'react'

type Props = {
  initialValue?: string
  path: string
  readOnly: boolean
}
export function TenantFieldComponentClient({ initialValue, path, readOnly }: Props) {
  const { formInitializing, setValue } = useField({ path })
  const hasSetInitialValue = React.useRef(false)

  React.useEffect(() => {
    if (!hasSetInitialValue.current && !formInitializing && initialValue) {
      setValue(initialValue)
      hasSetInitialValue.current = true
    }
  }, [initialValue, setValue, formInitializing])

  return (
    <RelationshipField
      field={{
        name: path,
        type: 'relationship',
        _path: path,
        label: 'Tenant',
        relationTo: 'tenants',
        required: true,
      }}
      readOnly={readOnly}
    />
  )
}
