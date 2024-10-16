'use client'
import { RelationshipField, useField, useFieldProps } from '@payloadcms/ui'
import React from 'react'

type Props = {
  initialValue?: string
  readOnly: boolean
}
export function TenantFieldComponentClient({ initialValue, readOnly }: Props) {
  const { path } = useFieldProps()
  const { formInitializing, setValue, value } = useField({ path })
  const hasSetInitialValue = React.useRef(false)

  React.useEffect(() => {
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
        _path: path,
        label: 'Tenant',
        relationTo: 'tenants',
        required: true,
      }}
      readOnly={readOnly}
    />
  )
}
