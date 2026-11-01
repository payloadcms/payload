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
  /** Returns whether focus should move after the page changed, and clears the request. */
  consumeFocusRequest: () => boolean
  hasPinPlaceholder: boolean
  isDisabled: boolean
  labels: Labels
  listID: string
  offset: number
  onFocusTab: () => void
  onPageChange: (args: { offset: number }) => void
  /** `null` until the CSS page size is read. */
  pageSize: null | number
  totalDocs: number
}) {
  const { t } = useTranslation()
  const previousRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  // Before the CSS page size is known, render one pagination per page size and let CSS pick one.
  const sizes: readonly number[] = pageSize ? [pageSize] : PAGE_SIZES
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
    // Keep focus on a control that is still enabled once the page changed.
    if (totalPages === 1) {
      onFocusTab()
    } else if (currentPage === 1) {
      nextRef.current?.focus()
    } else if (currentPage === totalPages) {
      previousRef.current?.focus()
    }
  }, [consumeFocusRequest, currentPage, isDisabled, onFocusTab, pageSize, totalPages])

  return sizes.map((size) => {
    const page = getDocumentPage({
      cache: { batches: {}, totalDocs },
      hasPinPlaceholder,
      offset,
      pageSize: size,
    })

    if (page.totalPages <= 1) {
      return null
    }

    const changePage = ({ pageNumber }: { pageNumber: number }) => {
      if (!isDisabled) {
        onPageChange({ offset: (pageNumber - 1) * size })
      }
    }

    return (
      <div
        aria-label={labels.pagination}
        className="activity-widget__pagination"
        data-page-size={pageSize ? undefined : size}
        key={size}
        role="group"
      >
        <button
          aria-controls={listID}
          aria-disabled={isDisabled}
          aria-label={labels.previous}
          className="activity-widget__previous"
          disabled={page.currentPage === 1}
          onClick={() => changePage({ pageNumber: page.currentPage - 1 })}
          ref={previousRef}
          type="button"
        >
          <span aria-hidden="true">
            <ChevronIcon direction="left" />
          </span>
        </button>
        <span aria-atomic="true" aria-live="polite" className="activity-widget__page-status">
          {t('dashboard:widgetPageCount', {
            currentPage: page.currentPage,
            totalPages: page.totalPages,
          })}
        </span>
        <button
          aria-controls={listID}
          aria-disabled={isDisabled}
          aria-label={labels.next}
          className="activity-widget__next"
          disabled={page.currentPage === page.totalPages}
          onClick={() => changePage({ pageNumber: page.currentPage + 1 })}
          ref={nextRef}
          type="button"
        >
          <span aria-hidden="true">
            <ChevronIcon direction="right" />
          </span>
        </button>
      </div>
    )
  })
}
