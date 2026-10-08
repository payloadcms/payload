'use client'
import type { RelationshipFieldLabelClientProps } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomRelationshipFieldLabelClient: React.FC<RelationshipFieldLabelClientProps> = ({
  field,
  path,
}) => {
  return <FieldLabel label={field?.label || field?.name} path={path} required={field?.required} />
}
