import React from 'react'

import { SearchIcon } from '../../icons/Search/index.js'
import { SearchFilter } from '../SearchFilter/index.js'
import './index.css'

const baseClass = 'search-bar'

type SearchBarProps = {
  Actions?: React.ReactNode[]
  className?: string
  disabled?: boolean
  label?: string
  onSearchChange: (search: string) => void
  searchQueryParam?: string
}
export function SearchBar({
  Actions,
  className,
  disabled,
  label = 'Search...',
  onSearchChange,
  searchQueryParam,
}: SearchBarProps) {
  return (
    <div className={[baseClass, className].filter(Boolean).join(' ')}>
      <SearchIcon />
      <SearchFilter
        disabled={disabled}
        handleChange={onSearchChange}
        label={label}
        searchQueryParam={searchQueryParam}
      />
      {Actions && Actions.length > 0 ? (
        <div className={`${baseClass}__actions`}>{Actions}</div>
      ) : null}
    </div>
  )
}
