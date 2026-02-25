'use client'

import type { PayloadClientReactComponent, RowLabelComponent } from 'payload'

import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

export const ArrayRowLabel: PayloadClientReactComponent<RowLabelComponent> = () => {
  const { data } = useRowLabel<{ title: string }>()
  return (
    <div id="custom-array-row-label" style={{ color: 'coral', textTransform: 'uppercase' }}>
      {data.title || 'Untitled'}
    </div>
  )
}
