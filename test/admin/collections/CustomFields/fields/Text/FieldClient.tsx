'use client'
import type { TextFieldClientComponent } from 'payload'

import { TextField } from '@payloadcms/ui'
import React from 'react'

export const CustomClientField: TextFieldClientComponent = (props) => {
  return <TextField {...props} />
}
