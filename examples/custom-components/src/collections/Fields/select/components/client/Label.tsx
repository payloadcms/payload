'use client'
import type { SelectFieldLabelClientComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomSelectFieldLabelClient: SelectFieldLabelClientComponent = ({ field, label }) => {
  return <FieldLabel field={field} label={label} />
}
