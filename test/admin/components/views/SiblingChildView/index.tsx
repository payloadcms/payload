import type { AdminViewServerProps } from 'payload'

import { MinimalTemplate } from '@payloadcms/next/templates'
import React from 'react'

export function SiblingChildView({ params }: AdminViewServerProps) {
  const id = params?.segments?.[1]

  return (
    <MinimalTemplate>
      <h1 id="sibling-child-view-title">Sibling Child View</h1>
      <p id="sibling-child-view-id">{id}</p>
    </MinimalTemplate>
  )
}
