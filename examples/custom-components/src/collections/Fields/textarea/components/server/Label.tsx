import type { TextareaFieldLabelServerComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomTextareaFieldLabelServer: TextareaFieldLabelServerComponent = ({
  clientField,
  label,
}) => {
  return <FieldLabel field={clientField} label={label} />
}
