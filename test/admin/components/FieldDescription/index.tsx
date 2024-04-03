'use client'
import type { DescriptionComponent } from 'payload/types'

import { useFieldProps } from '@payloadcms/ui/forms/FieldPropsProvider'
import { useFormFields } from '@payloadcms/ui/forms/Form'
import React from 'react'

export const FieldDescriptionComponent: DescriptionComponent = () => {
  const { path } = useFieldProps()
  const { value } = useFormFields(([fields]) => fields[path])

  return (
    <div className={`field-description-${path}`}>
      Component description: {path} - {value}
    </div>
  )
}
