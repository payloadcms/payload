'use client'
import type { PointFieldLabelClientComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomPointFieldLabelClient: PointFieldLabelClientComponent = ({ field }) => {
  return <FieldLabel field={field} />
}
