'use client'

import type { ChangeEvent, KeyboardEvent } from 'react'

import React, { useCallback } from 'react'

import { SearchIcon } from '../../../icons/Search/index.js'
import { XIcon } from '../../../icons/X/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'

const baseClass = 'hierarchy-search-input'

type HierarchySearchInputProps = {
  onChange: (value: string) => void
  onClear: () => void
  onSearch: (value: string) => void
  placeholder?: string
  value: string
}

export const HierarchySearchInput: React.FC<HierarchySearchInputProps> = ({
  onChange,
  onClear,
  onSearch,
  placeholder,
  value,
}) => {
  const { t } = useTranslation()
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

  const hasValue = value.length > 0

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
      {hasValue && (
        <button
          aria-label={t('general:clear')}
          className={`${baseClass}__clear`}
          onClick={handleClear}
          type="button"
        >
          <XIcon />
        </button>
      )}
    </div>
  )
}
