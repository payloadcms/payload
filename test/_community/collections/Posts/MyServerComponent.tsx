import type { TextFieldServerComponent } from 'payload'

import { TextField } from '@payloadcms/ui'
import React from 'react'

export const MyServerComponent: TextFieldServerComponent = (props) => {
  const { createClientField } = props

  const clientField = createClientField()

  return <TextField field={clientField} />
}
