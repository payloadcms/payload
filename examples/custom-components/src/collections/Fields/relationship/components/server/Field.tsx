import type { RelationshipFieldServerProps } from 'payload'
import type React from 'react'

import { RelationshipField } from '@payloadcms/ui'

export const CustomRelationshipFieldServer: React.FC<RelationshipFieldServerProps> = ({
  clientField,
  path,
  schemaPath,
  permissions,
}) => {
  return (
    <RelationshipField
      field={clientField}
      path={path}
      schemaPath={schemaPath}
      permissions={permissions}
    />
  )
}
