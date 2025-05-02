import type { ServerSideEditViewProps } from 'payload'

import { Gutter } from '@payloadcms/ui'
import React from 'react'

export const CustomTabEditView: React.FC<ServerSideEditViewProps> = () => {
  return (
    <Gutter>
      <h1>Custom Tab Edit View</h1>
    </Gutter>
  )
}
