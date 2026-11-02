import type { EmailFieldLabelServerProps } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomEmailFieldLabelServer: React.FC<EmailFieldLabelServerProps> = ({
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
