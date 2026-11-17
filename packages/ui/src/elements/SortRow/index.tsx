'use client'

import React from 'react'

import { AlignJustifiedIcon } from '../../icons/AlignJustified/index.js'
import { useListQuery } from '../../providers/ListQuery/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.css'

const baseClass = 'sort-row'

export const SortRow = () => {
  const { orderableFieldName, query } = useListQuery()
  const { t } = useTranslation()
  const isActive = query.sort === orderableFieldName || query.sort === `-${orderableFieldName}`

  return (
    <div className={`${baseClass} ${isActive ? 'active' : ''}`}>
      <span className="sr-only">{t('general:dragToMove')}</span>
      <AlignJustifiedIcon />
    </div>
  )
}
