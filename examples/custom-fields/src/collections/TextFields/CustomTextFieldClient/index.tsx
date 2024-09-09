'use client'
import type { TextFieldProps } from 'payload'

import { TextField } from '@payloadcms/ui'
import React from 'react'

export const CustomTextFieldClient: React.FC<TextFieldProps> = (props) => {
  const { field } = props

  return <TextField field={field} />
}
