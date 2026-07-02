import type { TextFieldServerComponent } from 'payload'

import { TextField } from '@payloadcms/ui'
import React from 'react'

export const TitleField: TextFieldServerComponent = ({ clientField, path, siblingData }) => {
  const value = (siblingData?.title as string | undefined) ?? ''

  // eslint-disable-next-line no-console
  console.log(`[TitleField server render] path=${path} value=${JSON.stringify(value)}`)

  return (
    <div id="custom-title-field">
      <TextField field={clientField} path={path} />
      <p style={{ fontSize: '0.85em', marginTop: '0.5rem', opacity: 0.7 }}>
        Character count: {value.length} (rendered on the server, path: {path})
      </p>
    </div>
  )
}
