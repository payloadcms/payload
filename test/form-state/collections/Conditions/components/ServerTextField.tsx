import type { TextFieldServerComponent } from 'payload'

import { TextField } from '@payloadcms/ui'
import { pid } from 'node:process'

export const ServerTextField: TextFieldServerComponent = ({ clientField, path }) => {
  const renderedAt = new Date().toISOString()

  return (
    <div data-pid={pid} data-rendered-at={renderedAt} id="custom-server-text-field">
      <p>{`custom server component rendered at ${renderedAt} (node pid: ${pid}).`}</p>
      <TextField field={clientField} path={path} />
    </div>
  )
}
