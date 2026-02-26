'use client'

import type { ChangeEvent, KeyboardEvent } from 'react'

import React, { useCallback } from 'react'

import { SearchIcon } from '../../icons/Search/index.js'
import { XIcon } from '../../icons/X/index.js'

const baseClass = 'hierarchy-search-input'

type HierarchySearchInputProps = {
  minChars?: number
  onChange: (value: string) => void
  onClear: () => void
  onSearch: (value: string) => void
  placeholder?: string
  value: string
}

export const HierarchySearchInput: React.FC<HierarchySearchInputProps> = ({
  minChars = 2,
  onChange,
  onClear,
  onSearch,
  placeholder = 'Search...',
  value,
}) => {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
    },
    [onChange],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && value.length >= minChars) {
        onSearch(value)
      }
    },
    [value, minChars, onSearch],
  )

  const handleClear = useCallback(() => {
    onClear()
  }, [onClear])

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__icon-container`}>
        <SearchIcon />
      </div>
      <input
        aria-label={placeholder}
        className={`${baseClass}__input`}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        type="text"
        value={value}
      />
      <div className={`${baseClass}__clear-container`}>
        <button
          aria-label="Clear search"
          className={`${baseClass}__clear`}
          onClick={handleClear}
          type="button"
        >
          <XIcon />
        </button>
      </div>
    </div>
  )
}
