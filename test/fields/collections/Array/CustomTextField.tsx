import type { TextFieldServerComponent } from 'payload'

import { TextField } from '@payloadcms/ui'

export const CustomTextField: TextFieldServerComponent = ({ clientField, path }) => {
  return (
    <div id="custom-text-field">
      <TextField field={clientField} path={path as string} />
    </div>
  )
}
