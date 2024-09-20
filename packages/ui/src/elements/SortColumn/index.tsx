'use client'
import type { FieldBase } from 'payload'

import React from 'react'

import { ChevronIcon } from '../../icons/Chevron/index.js'
import { useListQuery } from '../../providers/ListQuery/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.scss'

export type SortColumnProps = {
  readonly appearance?: 'condensed' | 'default'
  readonly disable?: boolean
  readonly Label: React.ReactNode
  readonly label?: FieldBase['label']
  readonly name: string
}

const baseClass = 'sort-column'

export const SortColumn: React.FC<SortColumnProps> = (props) => {
  const { name, appearance, disable = false, Label, label } = props
  const { handleSortChange, params } = useListQuery()
  const { t } = useTranslation()

  const { sort } = params

  const desc = `-${name}`
  const asc = name

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
      <span className={`${baseClass}__label`}>{Label}</span>
      {!disable && (
        <div className={`${baseClass}__buttons`}>
          <button
            aria-label={t('general:sortByLabelDirection', {
              direction: t('general:ascending'),
              label,
            })}
            className={[...ascClasses, `${baseClass}__button`].filter(Boolean).join(' ')}
            onClick={() => void handleSortChange(asc)}
            type="button"
          >
            <ChevronIcon direction="up" />
          </button>
          <button
            aria-label={t('general:sortByLabelDirection', {
              direction: t('general:descending'),
              label,
            })}
            className={[...descClasses, `${baseClass}__button`].filter(Boolean).join(' ')}
            onClick={() => void handleSortChange(desc)}
            type="button"
          >
            <ChevronIcon />
          </button>
        </div>
      )}
    </div>
  )
}
