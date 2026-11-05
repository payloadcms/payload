import type { PointFieldServerProps } from 'payload'
import type React from 'react'

import { PointField } from '@payloadcms/ui'

export const CustomPointFieldServer: React.FC<PointFieldServerProps> = ({
  clientField,
  path,
  schemaPath,
  permissions,
}) => {
  return (
    <PointField field={clientField} path={path} schemaPath={schemaPath} permissions={permissions} />
  )
}
