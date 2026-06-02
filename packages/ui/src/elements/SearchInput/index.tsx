'use client'

import React, { useCallback } from 'react'

import { SearchIcon } from '../../icons/Search/index.js'
import { XIcon } from '../../icons/X/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.css'

const baseClass = 'search-input'

type SearchInputProps = {
  'aria-label'?: string
  className?: string
  disabled?: boolean
  id?: string
  onChange: (value: string) => void
  onClear?: () => void
  onSearch?: (value: string) => void
  placeholder?: string
  value: string
}

export const SearchInput: React.FC<SearchInputProps> = ({
  id,
  'aria-label': ariaLabel,
  className,
  disabled,
  onChange,
  onClear,
  onSearch,
  placeholder,
  value,
}) => {
  const { t } = useTranslation()

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && value.length > 0) {
        onSearch(value)
      }
    },
    [value, onSearch],
  )

  return (
    <div className={[baseClass, className].filter(Boolean).join(' ')}>
      <SearchIcon />
      <input
        aria-label={ariaLabel ?? placeholder}
        className={`${baseClass}__input`}
        disabled={disabled}
        id={id}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onSearch ? handleKeyDown : undefined}
        placeholder={placeholder}
        type="text"
        value={value}
      />
      {onClear && value.length > 0 && (
        <button
          aria-label={t('general:clear')}
          className={`${baseClass}__clear`}
          onClick={onClear}
          type="button"
        >
          <XIcon />
        </button>
      )}
    </div>
  )
}
