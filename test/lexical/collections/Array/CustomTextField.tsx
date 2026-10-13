import type { TextFieldServerProps } from 'payload'
import type React from 'react'

import { TextField } from '@payloadcms/ui'

export const CustomTextField: React.FC<TextFieldServerProps> = ({ clientField, path }) => {
  return (
    <div id="custom-text-field">
      <TextField field={clientField} path={path} />
    </div>
  )
}
