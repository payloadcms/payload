'use client'

import React from 'react'

import { DragHandleIcon } from '../../icons/DragHandle/index.js'
import './index.scss'

const baseClass = 'sort-row'

export const SortRow = () => {
  return (
    <div className={baseClass} role="button" tabIndex={0}>
      <DragHandleIcon className={`${baseClass}__icon`} />
    </div>
  )
}
