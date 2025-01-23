import type { CodeFieldServerComponent } from 'payload'
import type React from 'react'

import { CodeField } from '@payloadcms/ui'

export const CustomCodeFieldServer: CodeFieldServerComponent = ({
  clientField,
  path,
  schemaPath,
  permissions,
}) => {
  return (
    <CodeField field={clientField} path={path} schemaPath={schemaPath} permissions={permissions} />
  )
}
