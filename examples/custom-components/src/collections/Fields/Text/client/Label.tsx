'use client'
import type { TextFieldLabelClientComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomTextFieldClient: TextFieldLabelClientComponent = (props) => {
  const { field } = props

  return <FieldLabel field={field} />
}
