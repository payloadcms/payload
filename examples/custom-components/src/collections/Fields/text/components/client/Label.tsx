'use client'
import type { TextFieldLabelClientComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomTextFieldLabelClient: TextFieldLabelClientComponent = ({ field, label }) => {
  return <FieldLabel field={field} label={label} />
}
