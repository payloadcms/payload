'use client'
import type { DateFieldLabelClientProps } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomDateFieldLabelClient: React.FC<DateFieldLabelClientProps> = ({
  field,
  path,
}) => {
  return <FieldLabel label={field?.label || field?.name} path={path} required={field?.required} />
}
