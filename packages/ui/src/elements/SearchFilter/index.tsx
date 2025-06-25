'use client'
import React, { useEffect, useRef, useState } from 'react'

export type SearchFilterProps = {
  /**
   * This prop is deprecated and will be removed in the next major version.
   *
   * @deprecated
   */
  fieldName?: string
  handleChange?: (search: string) => void
  /**
   * This prop is deprecated and will be removed in the next major version.
   *
   * Prefer passing in `searchString` instead.
   *
   * @deprecated
   */
  initialParams?: ParsedQs
  label: string
  searchQueryParam?: string
  /**
   * This prop is deprecated and will be removed in the next major version.
   *
   * @deprecated
   */
  setValue?: (arg: string) => void
  /**
   * This prop is deprecated and will be removed in the next major version.
   *
   * @deprecated
   */
  value?: string
}

import type { ParsedQs } from 'qs-esm'

import { usePathname } from 'next/navigation.js'

import { useDebounce } from '../../hooks/useDebounce.js'
import './index.scss'

const baseClass = 'search-filter'

export const SearchFilter: React.FC<SearchFilterProps> = (props) => {
  const { handleChange, initialParams, label, searchQueryParam } = props
  const searchParam = initialParams?.search || searchQueryParam
  const pathname = usePathname()
  const [search, setSearch] = useState(typeof searchParam === 'string' ? searchParam : undefined)

  /**
   * Tracks whether the state should be updated based on the search value.
   * If the value is updated from the URL, we don't want to update the state as it causes additional renders.
   */
  const shouldUpdateState = useRef(true)

  /**
   * Tracks the previous search value to compare with the current debounced search value.
   */
  const previousSearch = useRef(typeof searchParam === 'string' ? searchParam : undefined)

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    if (searchParam !== previousSearch.current) {
      shouldUpdateState.current = false
      setSearch(searchParam as string)
      previousSearch.current = searchParam as string
    }
  }, [searchParam, pathname])

  useEffect(() => {
    if (debouncedSearch !== previousSearch.current && shouldUpdateState.current) {
      if (handleChange) {
        handleChange(debouncedSearch)
      }

      previousSearch.current = debouncedSearch
    }
  }, [debouncedSearch, handleChange])

  return (
    <div className={baseClass}>
      <input
        aria-label={label}
        className={`${baseClass}__input`}
        id="search-filter-input"
        onChange={(e) => {
          shouldUpdateState.current = true
          setSearch(e.target.value)
        }}
        placeholder={label}
        type="text"
        value={search || ''}
      />
    </div>
  )
}
