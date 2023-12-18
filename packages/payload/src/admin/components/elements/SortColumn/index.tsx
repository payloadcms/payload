import queryString from 'qs'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import type { Props } from './types'

import { getTranslation } from '../../../../utilities/getTranslation'
import Chevron from '../../icons/Chevron'
import { useSearchParams } from '../../utilities/SearchParams'
import './index.scss'

const baseClass = 'sort-column'

const SortColumn: React.FC<Props> = (props) => {
  const { name, disable = false, label } = props
  const params = useSearchParams()
  const history = useHistory()
  const { i18n, t } = useTranslation('general')

  const { sort } = params

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
            ...params,
            sort: newSort,
          },
          { addQueryPrefix: true },
        ),
      })
    },
    [params, history],
  )

  return (
    <div className={baseClass}>
      <span className={`${baseClass}__label`}>{getTranslation(label, i18n)}</span>
      {!disable && (
        <div className={`${baseClass}__buttons`}>
          <button
            aria-label={t('sortByLabelDirection', {
              direction: t('ascending'),
              label: getTranslation(label, i18n),
            })}
            className={[...ascClasses, `${baseClass}__button`].filter(Boolean).join(' ')}
            onClick={() => setSort(asc)}
            type="button"
          >
            <Chevron direction="up" />
          </button>
          <button
            aria-label={t('sortByLabelDirection', {
              direction: t('descending'),
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
