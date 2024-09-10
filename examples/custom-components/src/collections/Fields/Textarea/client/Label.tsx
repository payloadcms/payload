'use client'
import type { TextareaFieldLabelClientComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomTextareaFieldClient: TextareaFieldLabelClientComponent = (props) => {
  const { field } = props

  return <FieldLabel field={field} />
}
