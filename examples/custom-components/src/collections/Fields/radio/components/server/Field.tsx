import type { RadioFieldServerProps } from 'payload'
import type React from 'react'

import { RadioGroupField } from '@payloadcms/ui'

export const CustomRadioFieldServer: React.FC<RadioFieldServerProps> = ({
  clientField,
  path,
  schemaPath,
  permissions,
}) => {
  return (
    <RadioGroupField
      field={clientField}
      path={path}
      schemaPath={schemaPath}
      permissions={permissions}
    />
  )
}
