'use client'
import type { DateFieldLabelClientComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomDateFieldLabelClient: DateFieldLabelClientComponent = (props) => {
  const { field, label } = props

  return <FieldLabel field={field} label={label} />
}
