import type { AdminViewServerProps } from 'payload'

import { MinimalTemplate } from '@payloadcms/next/templates'
import React from 'react'

export function SiblingRootView(_: AdminViewServerProps) {
  return (
    <MinimalTemplate>
      <h1 id="sibling-root-view-title">Sibling Root View</h1>
    </MinimalTemplate>
  )
}
