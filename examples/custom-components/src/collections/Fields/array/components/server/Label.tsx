import type { ArrayFieldLabelServerComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomArrayFieldLabelServer: ArrayFieldLabelServerComponent = ({ clientField }) => {
  return <FieldLabel field={clientField} />
}
