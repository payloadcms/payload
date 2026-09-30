import type { TextareaFieldLabelServerProps } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomTextareaFieldLabelServer: React.FC<TextareaFieldLabelServerProps> = ({
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
