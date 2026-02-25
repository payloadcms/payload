'use client'
import type { TextFieldClientComponent } from 'payload'

import { TextField } from '@payloadcms/ui'

export const CustomTextField: TextFieldClientComponent = (props) => {
  return <TextField {...props} />
}
