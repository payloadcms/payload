'use client'

import React from 'react'

import type { RowLabelComponent } from '../../../../packages/payload/src/admin/forms/RowLabel.js'

import { useRowLabel } from '../../../../packages/ui/src/forms/RowLabel/Context/index.js'

export const ArrayRowLabel: RowLabelComponent = () => {
  const { data } = useRowLabel<{ title: string }>()
  return (
    <div style={{ color: 'coral', textTransform: 'uppercase' }}>{data.title || 'Untitled'}</div>
  )
}
