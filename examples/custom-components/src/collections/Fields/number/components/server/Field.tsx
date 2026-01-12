import type { NumberFieldServerComponent } from 'payload'
import type React from 'react'

import { NumberField } from '@payloadcms/ui'

export const CustomNumberFieldServer: NumberFieldServerComponent = ({
  clientField,
  path,
  schemaPath,
  permissions,
}) => {
  return (
    <NumberField
      field={clientField}
      path={path}
      schemaPath={schemaPath}
      permissions={permissions}
    />
  )
}
