import type { TextFieldServerComponent } from 'payload'

import { TextField } from '@payloadcms/ui'

export const CustomTextField: TextFieldServerComponent = ({
  clientField,
  path,
  payload,
  schemaPath,
}) => {
  payload.logger.info('RENDERED CUSTOM SERVER COMPONENT')
  return <TextField field={clientField} path={path} schemaPath={schemaPath} />
}
