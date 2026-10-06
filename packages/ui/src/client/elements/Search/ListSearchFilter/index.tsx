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
  onSearchInputChange?: (search: string) => void
  searchQueryParam?: string
}

export function ListSearchFilter({
  className,
  disabled,
  label = 'Search...',
  onSearchChange,
  onSearchInputChange,
  searchQueryParam,
}: ListSearchFilterProps) {
  const { t } = useTranslation()
  const descriptionID = React.useId()
  const [search, setSearch] = useState(
    typeof searchQueryParam === 'string' ? searchQueryParam : undefined,
  )

  const shouldUpdateState = useRef(true)
  const previousSearch = useRef(typeof searchQueryParam === 'string' ? searchQueryParam : undefined)

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    if (searchQueryParam !== previousSearch.current) {
      shouldUpdateState.current = false
      setSearch(searchQueryParam)
      onSearchInputChange?.(searchQueryParam || '')
      previousSearch.current = searchQueryParam
    }

    return () => {
      shouldUpdateState.current = true
      previousSearch.current = undefined
    }
  }, [onSearchInputChange, searchQueryParam])

  useEffect(() => {
    if (debouncedSearch !== previousSearch.current && shouldUpdateState.current) {
      onSearchChange(debouncedSearch)
      previousSearch.current = debouncedSearch
    }
  }, [debouncedSearch, onSearchChange])

  return (
    <>
      <span className="sr-only" id={descriptionID}>
        {t('general:searchAutomatically')}
      </span>
      <SearchInput
        aria-describedby={descriptionID}
        autoComplete="off"
        className={className}
        disabled={disabled}
        id="search-filter-input"
        onChange={(value) => {
          shouldUpdateState.current = true
          setSearch(value)
          onSearchInputChange?.(value)
        }}
        onClear={() => {
          shouldUpdateState.current = true
          setSearch('')
          onSearchInputChange?.('')
        }}
        placeholder={label}
        value={search || ''}
      />
    </>
  )
}
