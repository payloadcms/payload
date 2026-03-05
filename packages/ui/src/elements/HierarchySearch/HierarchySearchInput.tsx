'use client'

import type { ChangeEvent, KeyboardEvent } from 'react'

import React, { useCallback } from 'react'

import { CheckboxPopup } from '../../elements/CheckboxPopup/index.js'
import { FilterIcon } from '../../icons/Filter/index.js'
import { SearchIcon } from '../../icons/Search/index.js'
import { XIcon } from '../../icons/X/index.js'

const baseClass = 'hierarchy-search-input'

type FilterOption = {
  label: string
  value: string
}

type HierarchySearchInputProps = {
  filterOptions?: FilterOption[]
  onChange: (value: string) => void
  onClear: () => void
  onFilterChange?: (values: string[]) => void
  onSearch: (value: string) => void
  placeholder?: string
  selectedFilters?: string[]
  value: string
}

export const HierarchySearchInput: React.FC<HierarchySearchInputProps> = ({
  filterOptions,
  onChange,
  onClear,
  onFilterChange,
  onSearch,
  placeholder = 'Search...',
  selectedFilters = [],
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
      if (e.key === 'Enter' && value.length > 0) {
        onSearch(value)
      }
    },
    [value, onSearch],
  )

  const handleClear = useCallback(() => {
    onClear()
  }, [onClear])

  const handleFilterChange = useCallback(
    ({ selectedValues }: { selectedValues: string[] }) => {
      onFilterChange?.(selectedValues)
    },
    [onFilterChange],
  )

  const hasFilters = filterOptions && filterOptions.length > 0
  const hasActiveFilters = selectedFilters.length > 0

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
      <div className={`${baseClass}__actions`}>
        {hasFilters && (
          <CheckboxPopup
            Button={
              <button
                aria-label="Filter by collection type"
                className={[
                  `${baseClass}__filter`,
                  hasActiveFilters && `${baseClass}__filter--active`,
                ]
                  .filter(Boolean)
                  .join(' ')}
                type="button"
              >
                <FilterIcon />
              </button>
            }
            onChange={handleFilterChange}
            options={filterOptions}
            selectedValues={selectedFilters}
          />
        )}
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
