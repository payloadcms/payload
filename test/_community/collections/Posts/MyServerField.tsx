import type { TextFieldServerComponent } from 'payload'

import { TextField } from '@payloadcms/ui'
import React from 'react'

export const MyServerFieldComponent: TextFieldServerComponent = ({ clientField, data }) => {
  console.log('data', data)
  return <TextField field={clientField} />
}
