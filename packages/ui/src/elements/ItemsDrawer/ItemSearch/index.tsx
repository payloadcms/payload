'use client'
import React, { useId } from 'react'

import { SearchIcon } from '../../../icons/Search/index.js'
import './index.scss'

const baseClass = 'item-search'

export type Props = {
  readonly placeholder?: string
  readonly setSearchTerm: (term: string) => void
}

export const ItemSearch: React.FC<Props> = ({ placeholder, setSearchTerm }) => {
  const inputId = useId()
  const labelId = `${inputId}-label`

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  return (
    <div className={baseClass}>
      <label className="sr-only" htmlFor={inputId} id={labelId}>
        {placeholder}
      </label>
      <input
        aria-labelledby={labelId}
        className={`${baseClass}__input`}
        id={inputId}
        onChange={handleChange}
        placeholder={placeholder}
        type="text"
      />
      <SearchIcon />
    </div>
  )
}
