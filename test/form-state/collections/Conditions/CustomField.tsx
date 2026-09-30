import type { TextFieldServerProps } from 'payload'
import type React from 'react'

import { TextField } from '@payloadcms/ui'

export const CustomTextField: React.FC<TextFieldServerProps> = ({
  clientField,
  path,
  payload,
  schemaPath,
}) => {
  payload.logger.info('RENDERED CUSTOM SERVER COMPONENT')
  return <TextField field={clientField} path={path} schemaPath={schemaPath} />
}
