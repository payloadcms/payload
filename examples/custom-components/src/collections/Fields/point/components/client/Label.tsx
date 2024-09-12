'use client'
import type { PointFieldLabelClientComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomPointFieldLabelClient: PointFieldLabelClientComponent = (props) => {
  const { field, label } = props

  return <FieldLabel field={field} label={label} />
}
