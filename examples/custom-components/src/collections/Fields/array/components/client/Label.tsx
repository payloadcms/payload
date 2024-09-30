'use client'
import type { ArrayFieldLabelClientComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomArrayFieldLabelClient: ArrayFieldLabelClientComponent = ({ field }) => {
  return <FieldLabel field={field} />
}
