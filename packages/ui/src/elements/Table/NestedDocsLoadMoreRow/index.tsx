'use client'

import React, { useEffect, useRef } from 'react'

import type { ParentID } from '../../../providers/NestedDocs/state.js'

import { useNestedDocsTree } from '../../../providers/NestedDocs/index.js'
import { branchKey } from '../../../providers/NestedDocs/state.js'
import { useTranslation } from '../../../providers/Translation/index.js'

export function NestedDocsLoadMoreRow({
  columnCount,
  hasCellNavigation,
  label,
  parentID,
}: {
  columnCount: number
  hasCellNavigation: boolean
  label: string
  parentID: ParentID
}) {
  const tree = useNestedDocsTree()
  const { t } = useTranslation()
  const ref = useRef<HTMLTableRowElement>(null)
  const key = branchKey({ parentID })
  const isPending = tree?.pending.has(key) ?? false
  const hasError = tree?.errors.has(key) ?? false
  const loadMore = tree?.loadMore

  useEffect(() => {
    if (!loadMore || isPending || hasError || !ref.current) {
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore({ parentID })
        }
      },
      { rootMargin: '120px' },
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [hasError, isPending, loadMore, parentID])

  return (
    <tr data-id={`load-${key}`} ref={ref} role={hasCellNavigation ? 'row' : undefined}>
      <td colSpan={columnCount} role={hasCellNavigation ? 'gridcell' : undefined}>
        {isPending && <span role="status">{`${t('general:loading')}: ${label}`}</span>}
        {hasError && <span role="alert">{t('error:loadingItems')}</span>}
        <button
          aria-label={`${t(hasError ? 'general:retry' : 'general:loadMore')}: ${label}`}
          disabled={isPending}
          onClick={() => void loadMore?.({ parentID })}
          type="button"
        >
          {isPending ? t('general:loading') : t(hasError ? 'general:retry' : 'general:loadMore')}
        </button>
      </td>
    </tr>
  )
}
