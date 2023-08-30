import queryString from 'qs'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import type { Where, WhereField } from '../../../../types/index.js'
import type { Props } from './types.js'

import { getTranslation } from '../../../../utilities/getTranslation.js'
import useDebounce from '../../../hooks/useDebounce.js'
import Search from '../../icons/Search/index.js'
import { useSearchParams } from '../../utilities/SearchParams/index.js'
import './index.scss'

const baseClass = 'search-filter'

const SearchFilter: React.FC<Props> = (props) => {
  const {
    fieldLabel = 'ID',
    fieldName = 'id',
    handleChange,
    listSearchableFields,
    modifySearchQuery = true,
  } = props

  const params = useSearchParams()
  const history = useHistory()
  const { i18n, t } = useTranslation('general')

  const [search, setSearch] = useState('')
  const [previousSearch, setPreviousSearch] = useState('')

  const placeholder = useRef(t('searchBy', { label: getTranslation(fieldLabel, i18n) }))

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    const newWhere: Where = {
      ...(typeof params?.where === 'object' ? (params.where as Where) : {}),
    }
    const fieldNamesToSearch =
      listSearchableFields?.length > 0
        ? [...listSearchableFields.map(({ name }) => name)]
        : [fieldName]

    fieldNamesToSearch.forEach((fieldNameToSearch) => {
      const hasOrQuery = Array.isArray(newWhere.or)
      const existingFieldSearchIndex = hasOrQuery
        ? newWhere.or.findIndex((condition) => {
            return (condition?.[fieldNameToSearch] as WhereField)?.like
          })
        : -1
      if (debouncedSearch) {
        if (!hasOrQuery) newWhere.or = []

        if (existingFieldSearchIndex > -1) {
          ;(newWhere.or[existingFieldSearchIndex][fieldNameToSearch] as WhereField).like =
            debouncedSearch
        } else {
          newWhere.or.push({
            [fieldNameToSearch]: {
              like: debouncedSearch,
            },
          })
        }
      } else if (existingFieldSearchIndex > -1) {
        newWhere.or.splice(existingFieldSearchIndex, 1)
      }
    })

    if (debouncedSearch !== previousSearch) {
      if (handleChange) handleChange(newWhere)

      if (modifySearchQuery) {
        history.replace({
          search: queryString.stringify({
            ...params,
            page: 1,
            where: newWhere,
          }),
        })
      }

      setPreviousSearch(debouncedSearch)
    }
  }, [
    debouncedSearch,
    previousSearch,
    history,
    fieldName,
    params,
    handleChange,
    modifySearchQuery,
    listSearchableFields,
  ])

  useEffect(() => {
    if (listSearchableFields?.length > 0) {
      placeholder.current = listSearchableFields.reduce<string>((prev, curr, i) => {
        if (i === 0) {
          return `${t('searchBy', { label: getTranslation(curr.label || curr.name, i18n) })}`
        }
        if (i === listSearchableFields.length - 1) {
          return `${prev} ${t('or')} ${getTranslation(curr.label || curr.name, i18n)}`
        }
        return `${prev}, ${getTranslation(curr.label || curr.name, i18n)}`
      }, '')
    } else {
      placeholder.current = t('searchBy', { label: getTranslation(fieldLabel, i18n) })
    }
  }, [t, listSearchableFields, i18n, fieldLabel])

  return (
    <div className={baseClass}>
      <input
        className={`${baseClass}__input`}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder.current}
        type="text"
        value={search || ''}
      />
      <Search />
    </div>
  )
}

export default SearchFilter
