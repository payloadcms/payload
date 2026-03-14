'use client'

import { TagIcon } from '@payloadcms/ui'
import React from 'react'

import './index.scss'

const baseClass = 'colored-tag-icon'

export type ColoredTagIconProps = {
  color?: string
}

export const ColoredTagIcon: React.FC<ColoredTagIconProps> = ({ color }) => {
  return (
    <span
      className={[baseClass, color ? `${baseClass}--custom-color` : ''].join(' ')}
      style={{ color }}
    >
      <TagIcon color={color ? undefined : 'muted'} />
    </span>
  )
}
