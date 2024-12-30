import type { BlocksFieldLabelServerComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomBlocksFieldLabelServer: BlocksFieldLabelServerComponent = (props) => {
  return <FieldLabel label={props?.label} />
}
