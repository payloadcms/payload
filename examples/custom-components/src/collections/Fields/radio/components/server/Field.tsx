import type { RadioFieldServerComponent } from 'payload'
import type React from 'react'

import { RadioGroupField } from '@payloadcms/ui'

export const CustomRadioFieldServer: RadioFieldServerComponent = ({
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
