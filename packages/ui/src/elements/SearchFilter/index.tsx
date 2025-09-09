'use client'

import React, { useEffect, useRef, useState } from 'react'

import type { SearchFilterProps } from './types.js'

import { useDebounce } from '../../hooks/useDebounce.js'
import './index.scss'

const baseClass = 'search-filter'

export function SearchFilter(props: SearchFilterProps) {
  const { handleChange, initialParams, label, searchQueryParam } = props
  const searchParam = initialParams?.search || searchQueryParam
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

    return () => {
      shouldUpdateState.current = true
      previousSearch.current = undefined
    }
  }, [searchParam])

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
