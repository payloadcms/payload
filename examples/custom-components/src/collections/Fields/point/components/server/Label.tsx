import type { PointFieldLabelServerProps } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomPointFieldLabelServer: React.FC<PointFieldLabelServerProps> = ({
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
