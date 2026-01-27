import type { ArrayFieldServerComponent } from 'payload'
import type React from 'react'

import { ArrayField } from '@payloadcms/ui'

export const CustomArrayFieldServer: ArrayFieldServerComponent = ({
  clientField,
  path,
  schemaPath,
  permissions,
}) => {
  return (
    <ArrayField field={clientField} path={path} schemaPath={schemaPath} permissions={permissions} />
  )
}
