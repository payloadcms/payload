'use client'
import type { TextareaFieldLabelClientComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomTextareaFieldLabelClient: TextareaFieldLabelClientComponent = ({
  field,
  label,
}) => {
  return <FieldLabel field={field} label={label} />
}
