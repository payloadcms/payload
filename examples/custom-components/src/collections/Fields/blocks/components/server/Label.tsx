import type { BlockFieldLabelServerComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomBlocksFieldLabelServer: BlockFieldLabelServerComponent = (props) => {
  const { field } = props

  // return <FieldLabel field={field} />

  return 'This is a server component for the blocks field label.'
}
