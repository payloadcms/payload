import type { TextFieldServerComponent } from 'payload'

import { TextField } from '@payloadcms/ui'
import { pid } from 'node:process'

export const ServerTextField: TextFieldServerComponent = ({ clientField, path }) => {
  const renderedAt = new Date().toISOString()

  return (
    <div data-pid={pid} data-rendered-at={renderedAt} id="custom-server-text-field">
      <TextField
        field={{
          ...clientField,
          admin: {
            ...clientField.admin,
            description: `Rendered at ${renderedAt} (node pid: ${pid}).`,
          },
        }}
        path={path}
      />
    </div>
  )
}
