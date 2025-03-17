'use client'

import React from 'react'

import { DragHandleIcon } from '../../icons/DragHandle/index.js'
import './index.scss'
import { useListQuery } from '../../providers/ListQuery/index.js'

const baseClass = 'sort-row'

export const SortRow = () => {
  const { query } = useListQuery()
  const isActive = query.sort === '_order' || query.sort === '-_order'

  return (
    <div className={`${baseClass} ${isActive ? 'active' : ''}`} role="button" tabIndex={0}>
      <DragHandleIcon className={`${baseClass}__icon`} />
    </div>
  )
}
