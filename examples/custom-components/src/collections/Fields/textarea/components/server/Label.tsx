import type { TextareaFieldLabelServerComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomTextareaFieldLabelServer: TextareaFieldLabelServerComponent = (props) => {
  return <FieldLabel label={props?.label} />
}
