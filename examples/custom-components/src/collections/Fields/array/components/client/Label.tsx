'use client'
import type { ArrayFieldLabelClientProps } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomArrayFieldLabelClient: React.FC<ArrayFieldLabelClientProps> = ({
  field,
  path,
}) => {
  return <FieldLabel label={field?.label || field?.name} path={path} required={field?.required} />
}
