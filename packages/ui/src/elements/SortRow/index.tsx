'use client'
import type { ClientUser } from 'payload'

import React from 'react'

import { DragHandleIcon } from '../../icons/DragHandle/index.js'
import './index.scss'

const baseClass = 'sort-row'

export const SortRow: React.FC<{
  rowData: {
    _isLocked?: boolean
    _userEditing?: ClientUser
    id: string
  }
}> = () => {
  return (
    <div className={baseClass}>
      <DragHandleIcon className={`${baseClass}__icon`} />
    </div>
  )
}
