import type { CheckboxFieldLabelServerComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomCheckboxFieldLabelServer: CheckboxFieldLabelServerComponent = ({
  clientField,
  label,
}) => {
  return <FieldLabel field={clientField} label={label} />
}
