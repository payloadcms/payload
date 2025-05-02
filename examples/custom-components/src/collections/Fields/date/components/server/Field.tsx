import type { DateFieldServerComponent } from 'payload'
import type React from 'react'

import { DateTimeField } from '@payloadcms/ui'

export const CustomDateFieldServer: DateFieldServerComponent = ({
  clientField,
  path,
  schemaPath,
  permissions,
}) => {
  return (
    <DateTimeField
      field={clientField}
      path={path}
      schemaPath={schemaPath}
      permissions={permissions}
    />
  )
}
