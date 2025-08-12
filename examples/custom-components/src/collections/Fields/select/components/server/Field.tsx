import type { SelectFieldServerComponent } from 'payload'
import type React from 'react'

import { SelectField } from '@payloadcms/ui'

export const CustomSelectFieldServer: SelectFieldServerComponent = ({
  clientField,
  path,
  schemaPath,
  permissions,
}) => {
  return (
    <SelectField
      field={clientField}
      path={path}
      schemaPath={schemaPath}
      permissions={permissions}
    />
  )
}
