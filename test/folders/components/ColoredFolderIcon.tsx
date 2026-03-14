'use client'

import { FolderIcon } from '@payloadcms/ui'
import React from 'react'

import './index.scss'

const baseClass = 'colored-folder-icon'

export type ColoredFolderIconProps = {
  color?: string
}

export const ColoredFolderIcon: React.FC<ColoredFolderIconProps> = ({ color }) => {
  return (
    <span
      className={[baseClass, color ? `${baseClass}--custom-color` : ''].join(' ')}
      style={{ color }}
    >
      <FolderIcon color={color ? undefined : 'muted'} />
    </span>
  )
}
