'use client'
import type { CheckboxFieldLabelClientComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomCheckboxFieldLabelClient: CheckboxFieldLabelClientComponent = ({ field }) => {
  return <FieldLabel field={field} />
}
