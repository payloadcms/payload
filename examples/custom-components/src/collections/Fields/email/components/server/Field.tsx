import type { EmailFieldServerProps } from 'payload'
import type React from 'react'

import { EmailField } from '@payloadcms/ui'

export const CustomEmailFieldServer: React.FC<EmailFieldServerProps> = ({
  clientField,
  path,
  schemaPath,
  permissions,
}) => {
  return (
    <EmailField field={clientField} path={path} schemaPath={schemaPath} permissions={permissions} />
  )
}
