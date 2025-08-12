'use client'

import React, { useEffect, useRef } from 'react'

import { SortDownIcon, SortUpIcon } from '../../icons/Sort/index.js'
import { useListQuery } from '../../providers/ListQuery/index.js'
import './index.scss'
import { useTranslation } from '../../providers/Translation/index.js'

export type SortHeaderProps = {
  readonly appearance?: 'condensed' | 'default'
  readonly disable?: boolean
}

const baseClass = 'sort-header'

function useSort() {
  const { handleSortChange, orderableFieldName, query } = useListQuery()
  const querySort = Array.isArray(query.sort) ? query.sort[0] : query.sort
  const sort = useRef<'asc' | 'desc'>(querySort === `-${orderableFieldName}` ? 'desc' : 'asc')
  const isActive = querySort === `-${orderableFieldName}` || querySort === orderableFieldName

  // This is necessary if you initialize the page without sort url param
  // but your preferences are to sort by -_order.
  // Since sort isn't updated, the arrow would incorrectly point upward.
  useEffect(() => {
    if (!isActive) {
      return
    }
    sort.current = querySort === `-${orderableFieldName}` ? 'desc' : 'asc'
  }, [orderableFieldName, querySort, isActive])

  const handleSortPress = () => {
    // If it's already sorted by the "_order" field, toggle between "asc" and "desc"
    if (isActive) {
      void handleSortChange(sort.current === 'asc' ? `-${orderableFieldName}` : orderableFieldName)
      sort.current = sort.current === 'asc' ? 'desc' : 'asc'
      return
    }
    // If NOT sorted by the "_order" field, sort by that field but do not toggle the current value of "asc" or "desc".
    void handleSortChange(sort.current === 'asc' ? orderableFieldName : `-${orderableFieldName}`)
  }

  return { handleSortPress, isActive, sort }
}

export const SortHeader: React.FC<SortHeaderProps> = (props) => {
  const { appearance } = props
  const { handleSortPress, isActive, sort } = useSort()
  const { t } = useTranslation()

  return (
    <div
      className={[baseClass, appearance && `${baseClass}--appearance-${appearance}`]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={`${baseClass}__buttons`}>
        {sort.current === 'desc' ? (
          <button
            aria-label={t('general:sortByLabelDirection', {
              direction: t('general:ascending'),
              label: 'Order',
            })}
            className={`${baseClass}__button ${baseClass}__${sort.current} ${isActive ? `${baseClass}--active` : ''}`}
            onClick={handleSortPress}
            type="button"
          >
            <SortDownIcon />
          </button>
        ) : (
          <button
            aria-label={t('general:sortByLabelDirection', {
              direction: t('general:descending'),
              label: 'Order',
            })}
            className={`${baseClass}__button ${baseClass}__${sort.current} ${isActive ? `${baseClass}--active` : ''}`}
            onClick={handleSortPress}
            type="button"
          >
            <SortUpIcon />
          </button>
        )}
      </div>
    </div>
  )
}
