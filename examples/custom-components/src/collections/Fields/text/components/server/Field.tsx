import type { TextFieldServerProps } from 'payload'
import type React from 'react'

import { TextField } from '@payloadcms/ui'

export const CustomTextFieldServer: React.FC<TextFieldServerProps> = ({
  clientField,
  path,
  schemaPath,
  permissions,
}) => {
  return (
    <TextField field={clientField} path={path} schemaPath={schemaPath} permissions={permissions} />
  )
}
