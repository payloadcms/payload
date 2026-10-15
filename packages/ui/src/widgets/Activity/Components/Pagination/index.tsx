import React, { useLayoutEffect, useRef } from 'react'

import type { Labels } from '../../types.js'

import { ChevronIcon } from '../../../../icons/Chevron/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { getDocumentPage } from '../../utils/cache.js'
import { DOCUMENTS_BATCH_SIZE, PAGE_SIZES } from '../../utils/constants.js'
import './index.css'

export function Pagination({
  consumeFocusRequest,
  hasPinPlaceholder,
  isDisabled,
  labels,
  listID,
  offset,
  onFocusTab,
  onPageChange,
  pageSize,
  totalDocs,
}: {
  consumeFocusRequest: () => boolean
  hasPinPlaceholder: boolean
  isDisabled: boolean
  labels: Labels
  listID: string
  offset: number
  onFocusTab: () => void
  onPageChange: (args: { offset: number }) => void
  pageSize: null | number
  totalDocs: number
}) {
  const { t } = useTranslation()
  const previousRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const sizes = pageSize ? [pageSize] : PAGE_SIZES
  const { currentPage, totalPages } = getDocumentPage({
    cache: { batches: {}, totalDocs },
    hasPinPlaceholder,
    offset,
    pageSize: pageSize ?? DOCUMENTS_BATCH_SIZE,
  })

  useLayoutEffect(() => {
    if (isDisabled || !consumeFocusRequest()) {
      return
    }
    if (totalPages === 1) {
      onFocusTab()
    } else if (currentPage === 1) {
      nextRef.current?.focus()
    } else if (currentPage === totalPages) {
      previousRef.current?.focus()
    }
  }, [currentPage, isDisabled, onFocusTab, pageSize, consumeFocusRequest, totalPages])

  const changePage = ({ page, size }: { page: number; size: number }) => {
    if (!isDisabled) {
      onPageChange({ offset: (page - 1) * size })
    }
  }

  return sizes.map((size) => {
    const { currentPage, totalPages } = getDocumentPage({
      cache: { batches: {}, totalDocs },
      hasPinPlaceholder,
      offset,
      pageSize: size,
    })

    return totalPages > 1 ? (
      <div
        aria-label={labels.pagination}
        className="activity-widget__pagination"
        data-page-size={pageSize ? undefined : size}
        key={pageSize ? 'pagination' : size}
        role="group"
      >
        <button
          aria-controls={listID}
          aria-disabled={isDisabled}
          aria-label={labels.previous}
          className="activity-widget__previous"
          disabled={currentPage === 1}
          onClick={() => changePage({ page: currentPage - 1, size })}
          ref={previousRef}
          type="button"
        >
          <span aria-hidden="true">
            <ChevronIcon direction="left" />
          </span>
        </button>
        <span aria-atomic="true" aria-live="polite" className="activity-widget__page-status">
          {t('dashboard:widgetPageCount', { currentPage, totalPages })}
        </span>
        <button
          aria-controls={listID}
          aria-disabled={isDisabled}
          aria-label={labels.next}
          className="activity-widget__next"
          disabled={currentPage === totalPages}
          onClick={() => changePage({ page: currentPage + 1, size })}
          ref={nextRef}
          type="button"
        >
          <span aria-hidden="true">
            <ChevronIcon direction="right" />
          </span>
        </button>
      </div>
    ) : null
  })
}
