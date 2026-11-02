import type { TextFieldLabelServerProps } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomTextFieldLabelServer: React.FC<TextFieldLabelServerProps> = ({
  clientField,
  path,
}) => {
  return (
    <FieldLabel
      label={clientField?.label || clientField?.name}
      path={path}
      required={clientField?.required}
    />
  )
}
