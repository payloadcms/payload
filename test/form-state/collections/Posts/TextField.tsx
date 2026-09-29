'use client'
import type { TextFieldClientProps } from 'payload'
import type React from 'react'

import { TextField } from '@payloadcms/ui'

export const CustomTextField: React.FC<TextFieldClientProps> = (props) => {
  return <TextField {...props} />
}
