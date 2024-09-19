import type { RadioFieldLabelServerComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomRadioFieldLabelServer: RadioFieldLabelServerComponent = ({
  clientField,
  label,
}) => {
  return <FieldLabel field={clientField} label={label} />
}
