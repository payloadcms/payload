'use client'
import React from 'react'

import { SearchIcon } from '../../../icons/Search/index.js'
import './index.scss'

const baseClass = 'item-search'

export type Props = {
  readonly placeholder?: string
  readonly setSearchTerm: (term: string) => void
}

export const ItemSearch: React.FC<Props> = ({ placeholder, setSearchTerm }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  return (
    <div className={baseClass}>
      <input
        aria-label={placeholder}
        className={`${baseClass}__input`}
        onChange={handleChange}
        placeholder={placeholder}
        type="text"
      />
      <SearchIcon />
    </div>
  )
}
