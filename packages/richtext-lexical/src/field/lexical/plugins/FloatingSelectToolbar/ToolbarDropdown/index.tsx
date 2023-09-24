import React from 'react'

const baseClass = 'floating-select-toolbar-popup__dropdown'
import type { FloatingToolbarSectionEntry } from '../types'

import './index.scss'

export const ToolbarDropdown = ({
  Icon,
  classNames,
  entries,
  onClick,
}: {
  Icon?: React.FC
  classNames?: string[]
  entries: FloatingToolbarSectionEntry[]
  onClick?: () => void
}) => {
  return (
    <div className={[baseClass, ...(classNames || [])].filter(Boolean).join(' ')} onClick={onClick}>
      <Icon />
    </div>
  )
}
