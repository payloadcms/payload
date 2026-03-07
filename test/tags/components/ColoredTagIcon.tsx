'use client'

import { TagIcon } from '@payloadcms/ui'
import React from 'react'

export const ColoredTagIcon: React.FC<{ color?: string }> = ({ color }) => {
  return (
    <span style={{ color }}>
      <TagIcon />
    </span>
  )
}
