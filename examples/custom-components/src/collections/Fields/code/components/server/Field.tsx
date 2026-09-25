import type { CodeFieldServerProps } from 'payload'
import type React from 'react'

import { CodeField } from '@payloadcms/ui'

export const CustomCodeFieldServer: React.FC<CodeFieldServerProps> = ({
  clientField,
  path,
  schemaPath,
  permissions,
}) => {
  return (
    <CodeField field={clientField} path={path} schemaPath={schemaPath} permissions={permissions} />
  )
}
