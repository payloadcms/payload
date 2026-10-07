import type { TextareaFieldServerProps } from 'payload'
import type React from 'react'

import { TextareaField } from '@payloadcms/ui'

export const CustomTextareaFieldServer: React.FC<TextareaFieldServerProps> = ({
  clientField,
  path,
  schemaPath,
  permissions,
}) => {
  return (
    <TextareaField
      field={clientField}
      path={path}
      schemaPath={schemaPath}
      permissions={permissions}
    />
  )
}
