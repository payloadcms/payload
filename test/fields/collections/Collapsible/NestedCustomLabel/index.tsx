'use client'

import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

export const NestedCustomLabel: React.FC = () => {
  const { data } = useRowLabel<{
    innerCollapsible: string
  }>()

  return (
    <div
      style={{
        color: 'hotpink',
        textTransform: 'uppercase',
      }}
    >
      {data?.innerCollapsible || 'Untitled'}
    </div>
  )
}
