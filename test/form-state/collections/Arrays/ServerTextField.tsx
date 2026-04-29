import type { TextFieldServerComponent } from 'payload'

import { TextField } from '@payloadcms/ui'
import { hostname } from 'node:os'
import { pid } from 'node:process'

export const ServerTextField: TextFieldServerComponent = ({ clientField, path }) => {
  const renderedAt = new Date().toISOString()
  const serverHost = hostname()

  return (
    <div
      data-pid={pid}
      data-rendered-at={renderedAt}
      data-server-host={serverHost}
      id="custom-server-text-field"
    >
      <p>{`${serverHost} (pid: ${pid}) rendered this field at ${renderedAt}.`}</p>
      <TextField field={clientField} path={path} />
    </div>
  )
}
