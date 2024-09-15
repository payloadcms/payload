'use client'
import type { TextFieldClientComponent } from 'payload'

import { TextField } from '@payloadcms/ui'
import React from 'react'

export const CustomTextFieldClient: TextFieldClientComponent = ({ field }) => {
  return <TextField field={field} />
}
