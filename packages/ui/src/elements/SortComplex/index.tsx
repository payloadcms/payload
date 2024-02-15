import queryString from 'qs'
import React, { useEffect, useState } from 'react'
import { useTranslation } from '../../providers/Translation'
import { useHistory } from 'react-router-dom'

import type { OptionObject } from 'payload/types'
import type { Props } from './types'

import { fieldAffectsData } from 'payload/types'
import { sortableFieldTypes } from 'payload/fields/index'
import { getTranslation } from '@payloadcms/translations'
import { useSearchParams } from '../../providers/SearchParams'
import ReactSelect from '../ReactSelect'
import './index.scss'

const baseClass = 'sort-complex'

const SortComplex: React.FC<Props> = (props) => {
  const { collection, handleChange, modifySearchQuery = true } = props

  const history = useHistory()
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
  const [initialSort] = useState(() => ({ label: t('general:descending'), value: '-' }))
  const [sortOrder, setSortOrder] = useState(initialSort)

  useEffect(() => {
    if (sortField?.value) {
      const newSortValue = `${sortOrder.value}${sortField.value}`

      if (handleChange) handleChange(newSortValue)

      if (searchParams.sort !== newSortValue && modifySearchQuery) {
        history.replace({
          search: queryString.stringify(
            {
              ...searchParams,
              sort: newSortValue,
            },
            { addQueryPrefix: true },
          ),
        })
      }
    }
  }, [history, searchParams, sortField, sortOrder, modifySearchQuery, handleChange])

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
              onChange={(incomingSort) => {
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

export default SortComplex
