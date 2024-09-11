'use client'
import type { NumberFieldLabelClientComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomNumberFieldLabelClient: NumberFieldLabelClientComponent = (props) => {
  const { field, label } = props

  return <FieldLabel field={field} label={label} />
}
