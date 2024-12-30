'use client'
import type { FieldDescriptionClientComponent } from 'payload'

import { useFormFields } from '@payloadcms/ui'
import React from 'react'

export const FieldDescriptionComponent: FieldDescriptionClientComponent = ({ path }) => {
  const field = useFormFields(([fields]) => (fields && fields?.[path]) || null)
  const { value } = field || {}

  return (
    <div className={`field-description-${path}`}>
      Component description: {path} - {value as string}
    </div>
  )
}
