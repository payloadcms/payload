import type { TextFieldLabelServerComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomTextFieldLabelServer: TextFieldLabelServerComponent = ({
  clientField,
  label,
}) => {
  return <FieldLabel field={clientField} label={label} />
}
