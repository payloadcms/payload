import queryString from 'qs'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import type { Props } from './types'

import { getTranslation } from '../../../../utilities/getTranslation'
import useDebounce from '../../../hooks/useDebounce'
import Search from '../../icons/Search'
import { useSearchParams } from '../../utilities/SearchParams'
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

  const [search, setSearch] = useState(typeof params?.search === 'string' ? params?.search : '')
  const [previousSearch, setPreviousSearch] = useState('')

  const placeholder = useRef(t('searchBy', { label: getTranslation(fieldLabel, i18n) }))

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    if (debouncedSearch !== previousSearch) {
      if (handleChange) handleChange(debouncedSearch)

      if (modifySearchQuery) {
        history.replace({
          search: queryString.stringify({
            ...params,
            page: 1,
            search: debouncedSearch || undefined,
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
