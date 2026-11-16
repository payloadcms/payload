'use client'
import type { RadioFieldLabelClientProps } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomRadioFieldLabelClient: React.FC<RadioFieldLabelClientProps> = ({
  field,
  path,
}) => {
  return <FieldLabel label={field?.label || field?.name} path={path} required={field?.required} />
}
