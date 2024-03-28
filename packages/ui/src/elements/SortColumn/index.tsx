'use client'
// TODO: abstract the `next/navigation` dependency out from this component
import { usePathname, useRouter } from 'next/navigation.js'
import queryString from 'qs'
import React, { useCallback } from 'react'

export type SortColumnProps = {
  Label: React.ReactNode
  disable?: boolean
  label?: FieldBase['label']
  name: string
}

import type { FieldBase } from 'payload/types'

import { Chevron } from '../../icons/Chevron/index.js'
import { useSearchParams } from '../../providers/SearchParams/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'sort-column'

export const SortColumn: React.FC<SortColumnProps> = (props) => {
  const { name, Label, disable = false, label } = props
  const { searchParams } = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslation()

  const { sort } = searchParams

  const desc = `-${name}`
  const asc = name

  const ascClasses = [`${baseClass}__asc`]
  if (sort === asc) ascClasses.push(`${baseClass}--active`)

  const descClasses = [`${baseClass}__desc`]
  if (sort === desc) descClasses.push(`${baseClass}--active`)

  const setSort = useCallback(
    (newSort) => {
      const search = queryString.stringify(
        {
          ...searchParams,
          sort: newSort,
        },
        { addQueryPrefix: true },
      )

      router.replace(`${pathname}?${search}`)
    },
    [searchParams, pathname, router],
  )

  return (
    <div className={baseClass}>
      <span className={`${baseClass}__label`}>{Label}</span>
      {!disable && (
        <div className={`${baseClass}__buttons`}>
          <button
            aria-label={t('general:sortByLabelDirection', {
              direction: t('general:ascending'),
              label,
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
              label,
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
