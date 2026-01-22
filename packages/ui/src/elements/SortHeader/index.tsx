'use client'

import React from 'react'

import { SortDownIcon } from '../../icons/Sort/index.js'
import { useListQuery } from '../../providers/ListQuery/index.js'
import './index.scss'
import { useTranslation } from '../../providers/Translation/index.js'

export type SortHeaderProps = {
  readonly appearance?: 'condensed' | 'default'
  readonly disable?: boolean
}

const baseClass = 'sort-header'

function useSort() {
  const { orderableFieldName, query, setQuery } = useListQuery()
  const querySort = Array.isArray(query.sort) ? query.sort[0] : query.sort
  const isActive = querySort === orderableFieldName

  const handleSortPress = () => {
    // If it's already sorted by the "_order" field, do nothing
    if (isActive) {
      return
    }
    // If NOT sorted by the "_order" field, sort by that field.
    setQuery({ sort: orderableFieldName })
  }

  return { handleSortPress, isActive }
}

export const SortHeader: React.FC<SortHeaderProps> = (props) => {
  const { appearance } = props
  const { handleSortPress, isActive } = useSort()
  const { t } = useTranslation()

  return (
    <div
      className={[baseClass, appearance && `${baseClass}--appearance-${appearance}`]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={`${baseClass}__buttons`}>
        <button
          aria-label={t('general:sortByLabelDirection', {
            direction: t('general:ascending'),
            label: 'Order',
          })}
          className={`${baseClass}__button ${isActive ? `${baseClass}--active` : ''}`}
          onClick={handleSortPress}
          type="button"
        >
          <SortDownIcon />
        </button>
      </div>
    </div>
  )
}
