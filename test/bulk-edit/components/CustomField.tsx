'use client'

import type { TextFieldClientProps } from 'payload'

import { TextField } from '@payloadcms/ui'
import React from 'react'

export const CustomField: React.FC<TextFieldClientProps> = (props) => {
  return (
    <div data-testid="custom-field">
      <TextField {...props} />
    </div>
  )
}
