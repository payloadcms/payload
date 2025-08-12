'use client'

import React from 'react'

import { DragHandleIcon } from '../../icons/DragHandle/index.js'
import './index.scss'
import { useListQuery } from '../../providers/ListQuery/index.js'

const baseClass = 'sort-row'

export const SortRow = () => {
  const { orderableFieldName, query } = useListQuery()
  const isActive = query.sort === orderableFieldName || query.sort === `-${orderableFieldName}`

  return (
    <div className={`${baseClass} ${isActive ? 'active' : ''}`} role="button" tabIndex={0}>
      <DragHandleIcon className={`${baseClass}__icon`} />
    </div>
  )
}
