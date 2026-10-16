'use client'

import { FolderIcon } from '@payloadcms/ui'
import React from 'react'

import './index.css'

const baseClass = 'colored-folder-icon'

export type ColoredFolderIconProps = {
  color?: string
  size?: 16 | 24
}

export const ColoredFolderIcon: React.FC<ColoredFolderIconProps> = ({ color, size = 24 }) => {
  return (
    <span
      className={[baseClass, color ? `${baseClass}--custom-color` : ''].join(' ')}
      style={{ color }}
    >
      <FolderIcon size={size} />
    </span>
  )
}
