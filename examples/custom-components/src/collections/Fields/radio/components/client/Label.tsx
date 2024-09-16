'use client'
import type { RadioFieldLabelClientComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomRadioFieldLabelClient: RadioFieldLabelClientComponent = ({ field, label }) => {
  return <FieldLabel field={field} label={label} />
}
