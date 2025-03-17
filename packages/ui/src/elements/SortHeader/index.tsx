'use client'

import React, { useRef } from 'react'

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
  const { handleSortChange, query } = useListQuery()
  const sort = useRef<'asc' | 'desc'>(query.sort === '-_order' ? 'desc' : 'asc')
  const isActive = query.sort === '-_order' || query.sort === '_order'

  const handleSortPress = () => {
    // If it's already sorted by the "_order" field, toggle between "asc" and "desc"
    if (isActive) {
      void handleSortChange(sort.current === 'asc' ? '-_order' : '_order')
      sort.current = sort.current === 'asc' ? 'desc' : 'asc'
      return
    }
    // If NOT sorted by the "_order" field, sort by that field but do not toggle the current value of "asc" or "desc".
    void handleSortChange(sort.current === 'asc' ? '_order' : '-_order')
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
