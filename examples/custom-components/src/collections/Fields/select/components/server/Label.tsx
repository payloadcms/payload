import type { SelectFieldLabelServerComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomSelectFieldLabelServer: SelectFieldLabelServerComponent = ({
  clientField,
  label,
}) => {
  return <FieldLabel field={clientField} label={label} />
}
