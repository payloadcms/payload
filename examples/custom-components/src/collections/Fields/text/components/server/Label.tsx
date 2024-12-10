import type { TextFieldLabelServerComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomTextFieldLabelServer: TextFieldLabelServerComponent = (props) => {
  return <FieldLabel label={props?.label} />
}
