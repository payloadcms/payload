import type { JSONFieldServerComponent } from 'payload'
import type React from 'react'

import { JSONField } from '@payloadcms/ui'

export const CustomJSONFieldServer: JSONFieldServerComponent = ({
  clientField,
  path,
  schemaPath,
  permissions,
}) => {
  return (
    <JSONField field={clientField} path={path} schemaPath={schemaPath} permissions={permissions} />
  )
}
