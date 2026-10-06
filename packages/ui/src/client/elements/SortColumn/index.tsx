'use client'
import type { StaticLabel } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { useId, useRef } from 'react'

import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { ChevronIcon } from '../../icons/Chevron/index.js'
import { useListQuery } from '../../providers/ListQuery/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useAriaSort } from '../Table/useAriaSort.js'
import './index.css'

export type SortColumnProps = {
  readonly appearance?: 'condensed' | 'default'
  readonly disable?: boolean
  readonly Label: React.ReactNode
  readonly label?: StaticLabel
  readonly name: string
}

const baseClass = 'sort-column'

export const SortColumn: React.FC<SortColumnProps> = (props) => {
  const { name, appearance, disable = false, Label, label } = props
  const { handleSortChange, query } = useListQuery()
  const { i18n, t } = useTranslation()
  const resolvedLabel = getTranslation(label || (typeof Label === 'string' ? Label : name), i18n)

  const { sort } = query

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

  const isSorted = sort === asc || sort === desc
  const labelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  useAriaSort({
    labelledBy: labelId,
    ref: rootRef,
    value: sort === asc ? 'ascending' : sort === desc ? 'descending' : undefined,
  })

  const descLabel = t('general:sortByLabelDirection', {
    direction: t('general:descending'),
    label: resolvedLabel,
  })
  const ascLabel = t('general:sortByLabelDirection', {
    direction: t('general:ascending'),
    label: resolvedLabel,
  })

  return (
    <div
      className={[
        baseClass,
        appearance && `${baseClass}--appearance-${appearance}`,
        isSorted && `${baseClass}--sorted`,
      ]
        .filter(Boolean)
        .join(' ')}
      ref={rootRef}
    >
      <span className={`${baseClass}__label`} id={labelId}>
        {Label ?? <FieldLabel hideLocale label={resolvedLabel} unstyled />}
      </span>
      {!disable && (
        <div className={`${baseClass}__buttons`} data-grid-sort-controls="">
          <button
            aria-label={descLabel}
            aria-pressed={sort === desc}
            className={[...descClasses, `${baseClass}__button`].filter(Boolean).join(' ')}
            onClick={() => void handleSortChange(desc)}
            title={descLabel}
            type="button"
          >
            <ChevronIcon size={16} />
          </button>
          <button
            aria-label={ascLabel}
            aria-pressed={sort === asc}
            className={[...ascClasses, `${baseClass}__button`].filter(Boolean).join(' ')}
            onClick={() => void handleSortChange(asc)}
            title={ascLabel}
            type="button"
          >
            <ChevronIcon direction="up" size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
