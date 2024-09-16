'use client'
import type { DateFieldLabelClientComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomDateFieldLabelClient: DateFieldLabelClientComponent = ({ field }) => {
  return <FieldLabel field={field} />
}
