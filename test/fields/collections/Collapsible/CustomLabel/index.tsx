'use client'

import { useRowLabel } from '@payloadcms/ui/forms/RowLabel/Context'
import React from 'react'

export const CustomLabelComponent: React.FC<{
  fallback?: string
  path: string
  style?: React.CSSProperties
}> = ({
  fallback = 'Untitled',
  path,
  style = {
    color: 'hotpink',
    textTransform: 'uppercase',
  },
}) => {
  const { data } = useRowLabel()

  return <div style={style}>{data?.[path] || fallback}</div>
}
