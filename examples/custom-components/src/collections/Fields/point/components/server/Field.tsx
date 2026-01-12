import type { PointFieldServerComponent } from 'payload'
import type React from 'react'

import { PointField } from '@payloadcms/ui'

export const CustomPointFieldServer: PointFieldServerComponent = ({
  clientField,
  path,
  schemaPath,
  permissions,
}) => {
  return (
    <PointField field={clientField} path={path} schemaPath={schemaPath} permissions={permissions} />
  )
}
