'use client'

import React from 'react'

import { useListQuery } from '../../providers/ListQuery/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './Pagination.css'

const baseClass = 'relationship-table-pagination'

export const RelationshipTablePagination: React.FC = () => {
  const { data, handlePageChange } = useListQuery()
  const { t } = useTranslation()

  const { hasNextPage, hasPrevPage, limit, nextPage, page, prevPage, totalDocs, totalPages } = data

  // Don't render pagination if there's only one page, no docs, or missing data
  if (!totalPages || totalPages <= 1 || !totalDocs || !page || !limit) {
    return null
  }

  const currentRangeStart = (page - 1) * limit + 1
  const currentRangeEnd = Math.min(page * limit, totalDocs)

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__nav`}>
        <button
          className={`${baseClass}__button`}
          disabled={!hasPrevPage}
          onClick={() => void handlePageChange(prevPage || 1)}
          type="button"
        >
          {t('general:previous')}
        </button>
        <button
          className={`${baseClass}__button`}
          disabled={!hasNextPage}
          onClick={() => void handlePageChange(nextPage || page + 1)}
          type="button"
        >
          {t('general:next')}
        </button>
      </div>
      <div className={`${baseClass}__count`}>
        {currentRangeStart} – {currentRangeEnd} {t('general:of')} {totalDocs}
      </div>
    </div>
  )
}
