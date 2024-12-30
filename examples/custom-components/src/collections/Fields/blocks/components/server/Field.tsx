import type { BlocksFieldServerComponent } from 'payload'
import type React from 'react'

import { BlocksField } from '@payloadcms/ui'

export const CustomBlocksFieldServer: BlocksFieldServerComponent = (props) => {
  const path = (props?.path || props?.field?.name || '') as string
  return <BlocksField field={props?.clientField} path={path} permissions={props?.permissions} />
}
