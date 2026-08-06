'use client'

import type { TextFieldClientComponent } from 'payload'

import { TextField } from '@payloadcms/ui'
import React from 'react'

export const CustomField: TextFieldClientComponent = (props) => {
  return (
    <div data-testid="custom-field">
      <TextField {...props} />
    </div>
  )
}
