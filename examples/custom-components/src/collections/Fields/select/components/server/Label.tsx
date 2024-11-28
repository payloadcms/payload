import type { SelectFieldLabelServerComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomSelectFieldLabelServer: SelectFieldLabelServerComponent = (props) => {
  return <FieldLabel label={props?.label} />
}
