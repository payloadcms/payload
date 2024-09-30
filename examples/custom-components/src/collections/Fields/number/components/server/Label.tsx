import type { NumberFieldLabelServerComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomNumberFieldLabelServer: NumberFieldLabelServerComponent = ({ clientField }) => {
  return <FieldLabel field={clientField} />
}
