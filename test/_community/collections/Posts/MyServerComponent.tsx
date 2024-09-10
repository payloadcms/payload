import type { TextFieldClient, TextFieldServerComponent } from 'payload'

import { TextField } from '@payloadcms/ui'
import React from 'react'

export const MyServerComponent: TextFieldServerComponent = (props) => {
  const { createClientField, field } = props

  const clientField = createClientField() as TextFieldClient

  return (
    <div>
      <TextField field={clientField} />{' '}
    </div>
  )
}
