import type { ServerSideEditViewProps } from 'payload'

import { Gutter } from '@payloadcms/ui'
import React from 'react'

export const CustomDefaultEditView: React.FC<ServerSideEditViewProps> = () => {
  return (
    <Gutter>
      <h1>Custom Default Edit View</h1>
    </Gutter>
  )
}
