'use client'

import React from 'react'

import './index.scss'
import { DragHandleVerticalIcon } from '../../icons/DragHandleVertical/index.js'

const baseClass = 'sort-row'

export const SortRow = () => {
  return (
    <div className={baseClass} role="button" tabIndex={0}>
      <DragHandleVerticalIcon className={`${baseClass}__icon`} />
    </div>
  )
}
