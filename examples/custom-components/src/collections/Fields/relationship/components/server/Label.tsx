import type { RelationshipFieldLabelServerProps } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomRelationshipFieldLabelServer: React.FC<RelationshipFieldLabelServerProps> = ({
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
