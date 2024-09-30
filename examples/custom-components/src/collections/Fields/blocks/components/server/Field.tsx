import type { BlocksFieldServerComponent } from 'payload'
import type React from 'react'

import { BlocksField } from '@payloadcms/ui'

export const CustomBlocksFieldServer: BlocksFieldServerComponent = ({ clientField }) => {
  return <BlocksField field={clientField} />
}
