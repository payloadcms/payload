import type { EmailFieldServerComponent } from 'payload'
import type React from 'react'

import { EmailField } from '@payloadcms/ui'

export const CustomEmailFieldServer: EmailFieldServerComponent = ({
  clientField,
  path,
  schemaPath,
  permissions,
}) => {
  return (
    <EmailField field={clientField} path={path} schemaPath={schemaPath} permissions={permissions} />
  )
}
