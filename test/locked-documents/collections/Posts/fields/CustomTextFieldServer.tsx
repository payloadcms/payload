import type { TextFieldServerProps } from 'payload'
import type React from 'react'

import { TextField } from '@payloadcms/ui'

export const CustomTextFieldServer: React.FC<TextFieldServerProps> = ({
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
