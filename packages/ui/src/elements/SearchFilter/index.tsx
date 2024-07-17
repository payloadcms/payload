'use client'
import React, { useEffect, useRef } from 'react'

export type SearchFilterProps = {
  fieldName?: string
  handleChange?: (search: string) => void
  initialParams?: ParsedQs
  label: string
  setValue?: (arg: string) => void
  value?: string
}

import type { ParsedQs } from 'qs-esm'

import { useDebounce } from '../../hooks/useDebounce.js'
import { SearchIcon } from '../../icons/Search/index.js'
import './index.scss'

const baseClass = 'search-filter'

export const SearchFilter: React.FC<SearchFilterProps> = (props) => {
  const { handleChange, initialParams, label, setValue, value } = props

  const previousSearch = useRef(
    typeof initialParams?.search === 'string' ? initialParams?.search : '',
  )

  const debouncedSearch = useDebounce(value, 300)

  useEffect(() => {
    if (debouncedSearch !== previousSearch.current) {
      if (handleChange) handleChange(debouncedSearch)

      previousSearch.current = debouncedSearch
    }
  }, [debouncedSearch, previousSearch, handleChange])

  // Cleans up the search input when the component is unmounted
  useEffect(() => () => setValue(''), [])

  return (
    <div className={baseClass}>
      <input
        aria-label={label}
        className={`${baseClass}__input`}
        id="search-filter-input"
        onChange={(e) => setValue(e.target.value)}
        placeholder={label}
        type="text"
        value={value || ''}
      />
      <SearchIcon />
    </div>
  )
}
