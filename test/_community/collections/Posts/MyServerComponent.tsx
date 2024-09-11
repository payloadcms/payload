import type { TextFieldClient, TextFieldServerComponent } from 'payload'

import { TextField } from '@payloadcms/ui'
import React from 'react'

export const MyServerComponent: TextFieldServerComponent = (props) => {
  const { createClientField } = props

  const clientField = createClientField() as TextFieldClient

  return <TextField field={clientField} />
}
