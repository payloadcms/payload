'use client'
import type { OptionObject, SanitizedCollectionConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'
// TODO: abstract the `next/navigation` dependency out from this component
import { usePathname, useRouter, useSearchParams } from 'next/navigation.js'
import { sortableFieldTypes } from 'payload'
import { fieldAffectsData } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useEffect, useState } from 'react'

export type SortComplexProps = {
  collection: SanitizedCollectionConfig
  handleChange?: (sort: string) => void
  modifySearchQuery?: boolean
  sort?: string
}

import type { Option } from '../ReactSelect/index.js'

import { useTranslation } from '../../providers/Translation/index.js'
import { ReactSelect } from '../ReactSelect/index.js'
import './index.scss'

const baseClass = 'sort-complex'

export const SortComplex: React.FC<SortComplexProps> = (props) => {
  const { collection, handleChange, modifySearchQuery = true } = props

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { i18n, t } = useTranslation()
  const [sortOptions, setSortOptions] = useState<OptionObject[]>()

  const [sortFields] = useState(() =>
    collection.fields.reduce((fields, field) => {
      if (fieldAffectsData(field) && sortableFieldTypes.indexOf(field.type) > -1) {
        return [
          ...fields,
          { label: getTranslation(field.label || field.name, i18n), value: field.name },
        ]
      }
      return fields
    }, []),
  )

  const [sortField, setSortField] = useState(sortFields[0])
  const [initialSort] = useState<Option>(() => ({ label: t('general:descending'), value: '-' }))
  const [sortOrder, setSortOrder] = useState(initialSort)

  useEffect(() => {
    if (sortField?.value) {
      const newSortValue = `${sortOrder.value}${sortField.value}`

      if (handleChange) {
        handleChange(newSortValue)
      }

      if (searchParams.get('sort') !== newSortValue && modifySearchQuery) {
        const search = qs.stringify(
          {
            ...searchParams,
            sort: newSortValue,
          },
          { addQueryPrefix: true },
        )

        router.replace(`${pathname}${search}`)
      }
    }
  }, [pathname, router, searchParams, sortField, sortOrder, modifySearchQuery, handleChange])

  useEffect(() => {
    setSortOptions([
      { label: t('general:ascending'), value: '' },
      { label: t('general:descending'), value: '-' },
    ])
  }, [i18n, t])

  return (
    <div className={baseClass}>
      <React.Fragment>
        <div className={`${baseClass}__wrap`}>
          <div className={`${baseClass}__select`}>
            <div className={`${baseClass}__label`}>{t('general:columnToSort')}</div>
            <ReactSelect onChange={setSortField} options={sortFields} value={sortField} />
          </div>
          <div className={`${baseClass}__select`}>
            <div className={`${baseClass}__label`}>{t('general:order')}</div>
            <ReactSelect
              onChange={(incomingSort: Option) => {
                setSortOrder(incomingSort || initialSort)
              }}
              options={sortOptions}
              value={sortOrder}
            />
          </div>
        </div>
      </React.Fragment>
    </div>
  )
}
