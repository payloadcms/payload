import type { BlocksFieldLabelServerComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomBlocksFieldLabelServer: BlocksFieldLabelServerComponent = ({ clientField }) => {
  return <FieldLabel field={clientField} />
}
