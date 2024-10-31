import type { TextFieldServerComponent } from 'payload'

import { TextField } from '@payloadcms/ui'
import React from 'react'

export const MyServerFieldComponent: TextFieldServerComponent = ({
  clientField,
  fieldState,
  path,
}) => {
  console.log(clientField)
  console.log({ clientField, fieldState, path })
  return null
  // console.log('Server field value:', fieldState?.value)
  // return <TextField field={clientField} path={path} />
}
