import type { CheckboxFieldServerProps } from 'payload'
import type React from 'react'

import { CheckboxField } from '@payloadcms/ui'

export const CustomCheckboxFieldServer: React.FC<CheckboxFieldServerProps> = ({
  clientField,
  path,
  schemaPath,
  permissions,
}) => {
  return (
    <CheckboxField
      field={clientField}
      path={path}
      schemaPath={schemaPath}
      permissions={permissions}
    />
  )
}
