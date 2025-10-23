import type { TextFieldServerComponent } from 'payload'
import type React from 'react'

import { TextField } from '@payloadcms/ui'

export const CustomTextFieldServer: TextFieldServerComponent = ({
  clientField,
  path,
  schemaPath,
  permissions,
}) => {
  return (
    <TextField field={clientField} path={path} schemaPath={schemaPath} permissions={permissions} />
  )
}
