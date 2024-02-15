'use client'
import queryString from 'qs'
import React, { useCallback } from 'react'
import { useTranslation } from '../../providers/Translation'
import { useHistory } from 'react-router-dom'

import type { Props } from './types'

import { getTranslation } from '@payloadcms/translations'
import { Chevron } from '../../icons/Chevron'
import { useSearchParams } from '../../providers/SearchParams'
import './index.scss'

const baseClass = 'sort-column'

export const SortColumn: React.FC<Props> = (props) => {
  const { name, disable = false, label } = props
  const { searchParams } = useSearchParams()
  const history = useHistory()
  const { i18n, t } = useTranslation()

  const { sort } = searchParams

  const desc = `-${name}`
  const asc = name

  const ascClasses = [`${baseClass}__asc`]
  if (sort === asc) ascClasses.push(`${baseClass}--active`)

  const descClasses = [`${baseClass}__desc`]
  if (sort === desc) descClasses.push(`${baseClass}--active`)

  const setSort = useCallback(
    (newSort) => {
      history.push({
        search: queryString.stringify(
          {
            ...searchParams,
            sort: newSort,
          },
          { addQueryPrefix: true },
        ),
      })
    },
    [searchParams, history],
  )

  return (
    <div className={baseClass}>
      <span className={`${baseClass}__label`}>{getTranslation(label, i18n)}</span>
      {!disable && (
        <div className={`${baseClass}__buttons`}>
          <button
            aria-label={t('general:sortByLabelDirection', {
              direction: t('general:ascending'),
              label: getTranslation(label, i18n),
            })}
            className={[...ascClasses, `${baseClass}__button`].filter(Boolean).join(' ')}
            onClick={() => setSort(asc)}
            type="button"
          >
            <Chevron direction="up" />
          </button>
          <button
            aria-label={t('general:sortByLabelDirection', {
              direction: t('general:descending'),
              label: getTranslation(label, i18n),
            })}
            className={[...descClasses, `${baseClass}__button`].filter(Boolean).join(' ')}
            onClick={() => setSort(desc)}
            type="button"
          >
            <Chevron />
          </button>
        </div>
      )}
    </div>
  )
}

export default SortColumn
