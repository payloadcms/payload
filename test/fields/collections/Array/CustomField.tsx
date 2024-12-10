import type { TextFieldServerComponent } from 'payload'

import { TextField } from '@payloadcms/ui'

export const CustomField: TextFieldServerComponent = ({ clientField, path }) => {
  return (
    <div id="custom-field">
      <TextField field={clientField} path={path as string} />
    </div>
  )
}
