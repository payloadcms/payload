import type { BlocksFieldServerProps } from 'payload'
import type React from 'react'

import { BlocksField } from '@payloadcms/ui'

export const CustomBlocksFieldServer: React.FC<BlocksFieldServerProps> = ({
  clientField,
  path,
  schemaPath,
  permissions,
}) => {
  return (
    <BlocksField
      field={clientField}
      path={path}
      schemaPath={schemaPath}
      permissions={permissions}
    />
  )
}
