'use client'
import type { DescriptionComponent } from 'payload'

import { useFieldProps } from '@payloadcms/ui/forms/FieldPropsProvider'
import { useFormFields } from '@payloadcms/ui/forms/Form'
import React from 'react'

export const FieldDescriptionComponent: DescriptionComponent = () => {
  const { path } = useFieldProps()
  const field = useFormFields(([fields]) => (fields && fields?.[path]) || null)
  const { value } = field || {}

  return (
    <div className={`field-description-${path}`}>
      Component description: {path} - {value as string}
    </div>
  )
}
