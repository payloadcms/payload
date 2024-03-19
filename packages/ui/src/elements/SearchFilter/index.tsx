import type { FieldAffectingData } from 'payload/types'

import { getTranslation } from '@payloadcms/translations'
// TODO: abstract the `next/navigation` dependency out from this component
import { usePathname, useRouter } from 'next/navigation.js'
import queryString from 'qs'
import React, { useEffect, useRef, useState } from 'react'

export type SearchFilterProps = {
  fieldLabel?: string
  fieldName?: string
  handleChange?: (search: string) => void
  listSearchableFields?: FieldAffectingData[]
  modifySearchQuery?: boolean
}

import { useDebounce } from '../../hooks/useDebounce.js'
import { Search } from '../../icons/Search/index.js'
import { useSearchParams } from '../../providers/SearchParams/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'search-filter'

const SearchFilter: React.FC<SearchFilterProps> = (props) => {
  const {
    fieldLabel = 'ID',
    fieldName = 'id',
    handleChange,
    listSearchableFields,
    modifySearchQuery = true,
  } = props

  const { searchParams } = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { i18n, t } = useTranslation()

  const [search, setSearch] = useState(
    typeof searchParams?.search === 'string' ? searchParams?.search : '',
  )
  const [previousSearch, setPreviousSearch] = useState('')

  const placeholder = useRef(t('general:searchBy', { label: getTranslation(fieldLabel, i18n) }))

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    if (debouncedSearch !== previousSearch) {
      if (handleChange) handleChange(debouncedSearch)

      if (modifySearchQuery) {
        const search = queryString.stringify({
          ...searchParams,
          page: 1,
          search: debouncedSearch || undefined,
        })

        router.replace(`${pathname}?${search}`)
      }

      setPreviousSearch(debouncedSearch)
    }
  }, [
    debouncedSearch,
    previousSearch,
    router,
    fieldName,
    searchParams,
    handleChange,
    modifySearchQuery,
    listSearchableFields,
    pathname,
  ])

  useEffect(() => {
    if (listSearchableFields?.length > 0) {
      placeholder.current = listSearchableFields.reduce<string>((prev, curr, i) => {
        if (i === 0) {
          return `${t('general:searchBy', {
            label: getTranslation(curr.label || curr.name, i18n),
          })}`
        }
        if (i === listSearchableFields.length - 1) {
          return `${prev} ${t('general:or')} ${getTranslation(curr.label || curr.name, i18n)}`
        }
        return `${prev}, ${getTranslation(curr.label || curr.name, i18n)}`
      }, '')
    } else {
      placeholder.current = t('general:searchBy', { label: getTranslation(fieldLabel, i18n) })
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
