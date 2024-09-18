import type { TextFieldServerComponent } from 'payload'
import type React from 'react'

import { TextField } from '@payloadcms/ui'

export const CustomTextFieldServer: TextFieldServerComponent = ({ clientField }) => {
  return <TextField field={clientField} />
}
