'use client'
import React, { useCallback, useState } from 'react'

import { ClickableArrow } from './ClickableArrow/index.js'
import './index.css'

const baseClass = 'paginator'

export type PaginationProps = {
  hasNextPage?: boolean
  hasPrevPage?: boolean
  limit?: number
  nextPage?: number
  numberOfNeighbors?: number
  onChange?: (page: number) => void
  page?: number
  prevPage?: number
  totalPages?: number
}

export const Pagination: React.FC<PaginationProps> = (props) => {
  const {
    hasNextPage = false,
    hasPrevPage = false,
    nextPage = null,
    onChange,
    page: currentPage = 1,
    prevPage = null,
    totalPages = 1,
  } = props

  const [inputValue, setInputValue] = useState(String(currentPage))

  // Sync input value when currentPage changes externally
  React.useEffect(() => {
    setInputValue(String(currentPage))
  }, [currentPage])

  const updatePage = useCallback(
    (page: number) => {
      if (typeof onChange === 'function') {
        onChange(page)
      }
    },
    [onChange],
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleInputBlur = () => {
    const parsed = parseInt(inputValue, 10)
    if (!isNaN(parsed)) {
      // Clamp to valid range
      const clamped = Math.max(1, Math.min(parsed, totalPages))
      if (clamped !== currentPage) {
        updatePage(clamped)
      } else {
        setInputValue(String(currentPage))
      }
    } else {
      // Reset to current page if not a number
      setInputValue(String(currentPage))
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    } else if (e.key === 'Escape') {
      setInputValue(String(currentPage))
      e.currentTarget.blur()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const parsed = parseInt(inputValue, 10)
      if (!isNaN(parsed) && parsed < totalPages) {
        setInputValue(String(parsed + 1))
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const parsed = parseInt(inputValue, 10)
      if (!isNaN(parsed) && parsed > 1) {
        setInputValue(String(parsed - 1))
      }
    }
  }

  const isSinglePage = !totalPages || totalPages <= 1

  return (
    <div className={baseClass}>
      <ClickableArrow
        direction="left"
        isDisabled={isSinglePage || !hasPrevPage}
        updatePage={() => updatePage(prevPage ?? Math.max(1, currentPage - 1))}
      />
      <ClickableArrow
        direction="right"
        isDisabled={isSinglePage || !hasNextPage}
        updatePage={() => updatePage(nextPage ?? currentPage + 1)}
      />
      <div className={`${baseClass}__page-input-wrapper`}>
        <input
          aria-label="Go to page"
          className={`${baseClass}__page-input`}
          disabled={isSinglePage}
          inputMode="numeric"
          max={totalPages}
          min={1}
          onBlur={handleInputBlur}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          style={{ width: `${Math.max(inputValue.length, 1)}ch` }}
          type="text"
          value={inputValue}
        />
        <span className={`${baseClass}__page-total`}>of {isSinglePage ? 1 : totalPages}</span>
      </div>
    </div>
  )
}
