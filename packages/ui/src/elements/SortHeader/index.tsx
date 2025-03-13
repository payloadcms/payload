'use client'
import type { StaticLabel } from 'payload'

import React from 'react'

import { SortDownIcon, SortUpIcon } from '../../icons/Sort/index.js'
import { useListQuery } from '../../providers/ListQuery/index.js'
import './index.scss'
import { useTranslation } from '../../providers/Translation/index.js'

export type SortHeaderProps = {
  readonly appearance?: 'condensed' | 'default'
  readonly disable?: boolean
}

const baseClass = 'sort-header'

export const SortHeader: React.FC<SortHeaderProps> = (props) => {
  const { appearance, disable = false } = props
  const { handleSortChange, query } = useListQuery()
  const { t } = useTranslation()

  const { sort } = query

  const desc = `-_order`
  const asc = '_order'

  const ascClasses = [`${baseClass}__asc`]
  if (sort === asc) {
    ascClasses.push(`${baseClass}--active`)
  }

  const descClasses = [`${baseClass}__desc`]
  if (sort === desc) {
    descClasses.push(`${baseClass}--active`)
  }

  return (
    <div
      className={[baseClass, appearance && `${baseClass}--appearance-${appearance}`]
        .filter(Boolean)
        .join(' ')}
    >
      {!disable && (
        <div className={`${baseClass}__buttons`}>
          {sort === asc ? (
            <button
              className={[...ascClasses, `${baseClass}__button`].filter(Boolean).join(' ')}
              onClick={() => void handleSortChange(desc)}
              type="button"
            >
              <SortUpIcon />
            </button>
          ) : (
            <button
              className={[...descClasses, `${baseClass}__button`].filter(Boolean).join(' ')}
              onClick={() => void handleSortChange(asc)}
              type="button"
            >
              <SortDownIcon />
            </button>
          )}
          {/* <button
            aria-label={t('general:sortByLabelDirection', {
              direction: t('general:ascending'),
              label: 'custom order',
            })}
            className={[...ascClasses, `${baseClass}__button`].filter(Boolean).join(' ')}
            onClick={() => void handleSortChange(asc)}
            type="button"
          >
            <SortUpIcon />
          </button> */}
          {/* <button
            aria-label={t('general:sortByLabelDirection', {
              direction: t('general:descending'),
              label: 'custom order',
            })}
            className={[...descClasses, `${baseClass}__button`].filter(Boolean).join(' ')}
            onClick={() => void handleSortChange(desc)}
            type="button"
          >
            <ChevronIcon />
          </button> */}
        </div>
      )}
    </div>
  )
}
