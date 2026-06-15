import type { AdminViewProps } from 'payload'

import { Gutter } from '@payloadcms/ui'
import { MinimalTemplate } from '@payloadcms/ui/rsc'
import React from 'react'

export const CustomMinimalRootView: React.FC<AdminViewProps> = () => {
  return (
    <MinimalTemplate>
      <Gutter>
        <h1>Custom Minimal Root View</h1>
        <br />
        <p>This view uses the Minimal Template.</p>
      </Gutter>
    </MinimalTemplate>
  )
}
