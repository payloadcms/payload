'use client'
import type { EmailFieldLabelClientComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomEmailFieldLabelClient: EmailFieldLabelClientComponent = ({ field }) => {
  return <FieldLabel field={field} />
}
