'use client'

import React from 'react'

import './index.scss'
import { DragHandleVerticalIcon } from '../../icons/DragHandleVertical/index.js'
import { useListQuery } from '../../providers/ListQuery/index.js'

const baseClass = 'sort-row'

export const SortRow = () => {
  const { query } = useListQuery()
  const isActive = query.sort === '_order' || query.sort === '-_order'

  return (
    <div className={`${baseClass} ${isActive ? 'active' : ''}`} role="button" tabIndex={0}>
      <DragHandleVerticalIcon className={`${baseClass}__icon`} />
    </div>
  )
}
