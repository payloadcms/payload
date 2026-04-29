import type { TextFieldServerComponent } from 'payload'

import { TextField } from '@payloadcms/ui'

export const ServerTextField: TextFieldServerComponent = ({ clientField, path }) => {
  return (
    <div id="custom-server-text-field">
      <TextField field={clientField} path={path} />
    </div>
  )
}
