import type { TextFieldLabelServerComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomTextFieldLabelServer: TextFieldLabelServerComponent = (props) => {
  const { field } = props

  // return <FieldLabel field={field} />

  return 'This is a server component for the text field label.'
}
