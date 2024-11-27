'use client'
import React, { useEffect, useRef, useState } from 'react'

export type SearchFilterProps = {
  fieldName?: string
  handleChange?: (search: string) => void
  initialParams?: ParsedQs
  label: string
  setValue?: (arg: string) => void
  value?: string
}

import type { ParsedQs } from 'qs-esm'

import { usePathname } from 'next/navigation.js'

import { useDebounce } from '../../hooks/useDebounce.js'
import './index.scss'

const baseClass = 'search-filter'

export const SearchFilter: React.FC<SearchFilterProps> = (props) => {
  const { handleChange, initialParams, label } = props
  const pathname = usePathname()
  const [search, setSearch] = useState(
    typeof initialParams?.search === 'string' ? initialParams?.search : undefined,
  )

  /**
   * Tracks whether the state should be updated based on the search value.
   * If the value is updated from the URL, we don't want to update the state as it causes additional renders.
   */
  const shouldUpdateState = useRef(true)

  /**
   * Tracks the previous search value to compare with the current debounced search value.
   */
  const previousSearch = useRef(
    typeof initialParams?.search === 'string' ? initialParams?.search : undefined,
  )

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    if (initialParams?.search !== previousSearch.current) {
      shouldUpdateState.current = false
      setSearch(initialParams?.search as string)
      previousSearch.current = initialParams?.search as string
    }
  }, [initialParams?.search, pathname])

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
