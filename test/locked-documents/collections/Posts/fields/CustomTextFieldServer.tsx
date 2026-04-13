import type { TextFieldServerComponent } from 'payload'
import type React from 'react'

import { TextField } from '@payloadcms/ui'

export const CustomTextFieldServer: TextFieldServerComponent = ({
  clientField,
  path,
  permissions,
  readOnly,
  schemaPath,
}) => {
  return (
    <TextField
      field={clientField}
      path={path}
      permissions={permissions}
      readOnly={readOnly}
      schemaPath={schemaPath}
    />
  )
}
