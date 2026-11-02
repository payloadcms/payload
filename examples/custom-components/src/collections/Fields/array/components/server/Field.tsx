import type { ArrayFieldServerProps } from 'payload'
import type React from 'react'

import { ArrayField } from '@payloadcms/ui'

export const CustomArrayFieldServer: React.FC<ArrayFieldServerProps> = ({
  clientField,
  path,
  schemaPath,
  permissions,
}) => {
  return (
    <ArrayField field={clientField} path={path} schemaPath={schemaPath} permissions={permissions} />
  )
}
