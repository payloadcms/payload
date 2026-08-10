'use client'
import type { PaginatedDocs } from 'payload'

import React from 'react'

import { useTranslation } from '../../../providers/Translation/index.js'
import { ClickableArrow } from '../ClickableArrow/index.js'
import './index.css'

const baseClass = 'simple-pagination'

export type SimplePaginationProps = {
  data: PaginatedDocs
  onChange?: (page: number) => void
}

/**
 * A simplified pagination component for inline use (e.g., in table headers).
 * Shows "X-Y of Z" with prev/next arrows. No page input or per-page selector.
 */
export const SimplePagination: React.FC<SimplePaginationProps> = ({ data, onChange }) => {
  const { i18n } = useTranslation()

  const {
    hasNextPage = false,
    hasPrevPage = false,
    limit,
    nextPage,
    page: currentPage = 1,
    pagingCounter,
    prevPage,
    totalDocs,
    totalPages = 1,
  } = data

  const handlePrevPage = () => {
    if (onChange && hasPrevPage) {
      onChange(prevPage ?? Math.max(1, currentPage - 1))
    }
  }

  const handleNextPage = () => {
    if (onChange && hasNextPage) {
      onChange(nextPage ?? currentPage + 1)
    }
  }

  // Don't render if no docs or only one page
  if (totalDocs === 0) {
    return null
  }

  const startItem = pagingCounter ?? (currentPage - 1) * limit + 1
  const endItem = Math.min(startItem + limit - 1, totalDocs)

  return (
    <div className={baseClass}>
      <span className={`${baseClass}__info`}>
        {startItem}-{endItem} {i18n.t('general:of')} {totalDocs}
      </span>
      {totalPages > 1 && (
        <div className={`${baseClass}__arrows`}>
          <ClickableArrow direction="left" isDisabled={!hasPrevPage} updatePage={handlePrevPage} />
          <ClickableArrow direction="right" isDisabled={!hasNextPage} updatePage={handleNextPage} />
        </div>
      )}
    </div>
  )
}
