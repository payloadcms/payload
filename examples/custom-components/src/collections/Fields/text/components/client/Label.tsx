'use client'
import type { TextFieldLabelClientProps } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomTextFieldLabelClient: React.FC<TextFieldLabelClientProps> = ({
  field,
  path,
}) => {
  return <FieldLabel label={field?.label || field?.name} path={path} required={field?.required} />
}
