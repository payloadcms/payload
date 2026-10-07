'use client'
import type { TextFieldClientProps } from 'payload'

import { TextField } from '@payloadcms/ui'
import React from 'react'

export const CustomTextFieldClient: React.FC<TextFieldClientProps> = (props) => {
  return <TextField {...props} />
}
