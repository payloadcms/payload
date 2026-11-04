'use client'
import type { Column, NestedDocRow } from 'payload'

import React, { useEffect, useRef } from 'react'

import type { ParentID } from '../../../providers/NestedDocs/state.js'

import { useDebounce } from '../../../hooks/useDebounce.js'
import { WarningIcon } from '../../../icons/Warning/index.js'
import { useNestedDocs } from '../../../providers/NestedDocs/index.js'
import { branchKey } from '../../../providers/NestedDocs/state.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { NestedDocCell } from '../NestedDocCell/index.js'
import './index.css'

export function NestedDocsLoadMore({
  columns,
  isGrid,
  label,
  parentID,
  titleColumn,
}: {
  columns: Column[]
  isGrid: boolean
  label: string
  parentID: ParentID
  titleColumn?: string
}) {
  const tree = useNestedDocs()
  const loadMore = tree?.loadMore
  const { t } = useTranslation()
  const ref = useRef<HTMLTableRowElement>(null)
  const key = branchKey(parentID)
  const isPending = tree?.pending.has(key) ?? false
  const hasError = tree?.errors.has(key) ?? false
  const hasLoadingDelay = useDebounce(isPending, 200)
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
  }, [hasError, isPending, parentID, loadMore])
  if (!tree) {
    return null
  }

  const parentRow = parentID === null ? undefined : tree.rows[String(parentID)]
  const continuationRow: NestedDocRow = {
    ancestorContinues:
      parentRow && parentRow.depth > 0
        ? [...(parentRow.ancestorContinues ?? []), !parentRow.isLastSibling]
        : [],
    depth: parentRow ? parentRow.depth + 1 : 0,
    hasChildren: false,
    hasMore: false,
    isExpanded: false,
    isLastSibling: true,
    limit: 0,
    parentID,
  }

  return (
    <tr
      className={`nested-docs-load-more${isPending ? ' nested-docs-load-more--pending' : ''}`}
      data-id={`load-${key}`}
      ref={ref}
      role={isGrid ? 'row' : undefined}
    >
      {columns.map(({ accessor }) => (
        <td
          className={
            accessor === titleColumn ? 'cell--linked' : `cell-${accessor.replace(/\./g, '__')}`
          }
          data-column={accessor}
          key={accessor}
          role={isGrid ? 'gridcell' : undefined}
        >
          {accessor === titleColumn && (
            <>
              {isPending && (
                <span className="sr-only" role="status">{`${t('general:loading')}: ${label}`}</span>
              )}
              {(!isPending || hasLoadingDelay) && (
                <div aria-hidden={isPending || undefined}>
                  <NestedDocCell
                    id={`continuation-${key}`}
                    isLastRendered={parentID === null}
                    row={continuationRow}
                    title=""
                  >
                    {isPending ? (
                      <span className="nested-docs-load-more__skeleton" />
                    ) : (
                      <div className="nested-docs-load-more__content">
                        {hasError && (
                          <span className="nested-docs-load-more__error" role="alert">
                            <span aria-hidden="true" className="nested-docs-load-more__error-icon">
                              <WarningIcon size={16} />
                            </span>
                            <span>{t('error:loadingItems')}</span>
                          </span>
                        )}
                        <button
                          aria-label={`${t(hasError ? 'general:retry' : 'general:loadMore')}: ${label}`}
                          onClick={() => void loadMore?.({ parentID })}
                          type="button"
                        >
                          {t(hasError ? 'general:retry' : 'general:loadMore')}
                        </button>
                      </div>
                    )}
                  </NestedDocCell>
                </div>
              )}
            </>
          )}
        </td>
      ))}
    </tr>
  )
}
