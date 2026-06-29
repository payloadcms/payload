'use client'

import React, { useEffect, useRef, useState } from 'react'

import { useDebounce } from '../../../hooks/useDebounce.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { SearchInput } from '../SearchInput/index.js'

type ListSearchFilterProps = {
  className?: string
  disabled?: boolean
  label?: string
  onSearchChange: (search: string) => void
  searchQueryParam?: string
}

export function ListSearchFilter({
  className,
  disabled,
  label: labelFromProps,
  onSearchChange,
  searchQueryParam,
}: ListSearchFilterProps) {
  const [search, setSearch] = useState(
    typeof searchQueryParam === 'string' ? searchQueryParam : undefined,
  )
  const { t } = useTranslation()

  const shouldUpdateState = useRef(true)
  const previousSearch = useRef(typeof searchQueryParam === 'string' ? searchQueryParam : undefined)

  const debouncedSearch = useDebounce(search, 300)

  const label = labelFromProps || t('general:searchBy', { label: '' }).split(' ')[0] // Simplified placeholder - just "Search" instead of "Search by X, Y, Z"

  useEffect(() => {
    if (searchQueryParam !== previousSearch.current) {
      shouldUpdateState.current = false
      setSearch(searchQueryParam)
      previousSearch.current = searchQueryParam
    }

    return () => {
      shouldUpdateState.current = true
      previousSearch.current = undefined
    }
  }, [searchQueryParam])

  useEffect(() => {
    if (debouncedSearch !== previousSearch.current && shouldUpdateState.current) {
      onSearchChange(debouncedSearch)
      previousSearch.current = debouncedSearch
    }
  }, [debouncedSearch, onSearchChange])

  return (
    <SearchInput
      className={className}
      disabled={disabled}
      id="search-filter-input"
      onChange={(value) => {
        shouldUpdateState.current = true
        setSearch(value)
      }}
      onClear={() => {
        shouldUpdateState.current = true
        setSearch('')
      }}
      placeholder={label}
      value={search || ''}
    />
  )
}
