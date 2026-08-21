'use client'

import React from 'react'

import { SortDownIcon, SortUpIcon } from '../../icons/Sort/index.js'
import { useListQuery } from '../../providers/ListQuery/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.css'

export type SortHeaderProps = {
  readonly appearance?: 'condensed' | 'default'
  readonly disable?: boolean
}

const baseClass = 'sort-header'

function useSort() {
  const { handleSortChange, orderableFieldName, query } = useListQuery()
  const querySort = Array.isArray(query.sort) ? query.sort[0] : query.sort
  const isAscending = querySort === orderableFieldName
  const isDescending = querySort === `-${orderableFieldName}`
  const isActive = isAscending || isDescending

  const handleSortPress = () => {
    void handleSortChange(isAscending ? `-${orderableFieldName}` : orderableFieldName)
  }

  return { handleSortPress, isActive, isAscending }
}

/** @internal */
export const SortHeader: React.FC<SortHeaderProps> = (props) => {
  const { appearance } = props
  const { handleSortPress, isActive, isAscending } = useSort()
  const { t } = useTranslation()

  return (
    <button
      aria-label={t('general:sortByLabelDirection', {
        direction: isAscending ? t('general:descending') : t('general:ascending'),
        label: 'Order',
      })}
      className={[
        baseClass,
        appearance && `${baseClass}--appearance-${appearance}`,
        isActive && `${baseClass}--active`,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={handleSortPress}
      type="button"
    >
      {isAscending ? <SortUpIcon /> : <SortDownIcon />}
    </button>
  )
}
