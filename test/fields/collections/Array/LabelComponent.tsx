'use client'

import type { RowLabelComponent } from 'payload'

import { useRowLabel } from '@payloadcms/ui/forms/RowLabel/Context'
import React from 'react'

export const ArrayRowLabel: RowLabelComponent = () => {
  const { data } = useRowLabel<{ title: string }>()
  return (
    <div style={{ color: 'coral', textTransform: 'uppercase' }}>{data.title || 'Untitled'}</div>
  )
}
