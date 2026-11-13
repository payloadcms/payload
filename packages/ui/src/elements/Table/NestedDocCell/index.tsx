'use client'

import type { NestedDocRow } from 'payload'

import React from 'react'

import { useDebounce } from '../../../hooks/useDebounce.js'
import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { SpinnerIcon } from '../../../icons/Spinner/index.js'
import { useNestedDocs } from '../../../providers/NestedDocs/index.js'
import { branchKey } from '../../../providers/NestedDocs/state.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import './index.css'

export function NestedDocCell({
  id,
  children,
  isLastRendered,
  isPending,
  onToggle,
  parentTitle,
  row,
  title,
}: {
  children: React.ReactNode
  id: string
  isLastRendered: boolean
  isPending?: boolean
  onToggle?: () => void
  parentTitle?: string
  row: NestedDocRow
  title: string
}) {
  const { t } = useTranslation()
  const tree = useNestedDocs()
  const isBranchPending = isPending ?? tree?.pending.has(branchKey(id))
  const hasLoadingDelay = useDebounce(Boolean(isBranchPending), 200)
  const shouldShowSpinner = row.isExpanded && isBranchPending && hasLoadingDelay

  return (
    <div
      aria-busy={isBranchPending}
      className="nested-doc-cell"
      style={{ '--nested-doc-depth': row.depth } as React.CSSProperties}
    >
      <span aria-hidden="true" className="nested-doc-cell__guides">
        <span
          className={`nested-doc-cell__root-spine${row.depth > 0 ? ' nested-doc-cell__root-spine--ancestor' : ''}${isLastRendered ? ' nested-doc-cell__guide--last' : ''}`}
        />
        {row.ancestorContinues?.map(
          (continues, level) =>
            continues && (
              <span
                className={`nested-doc-cell__guide nested-doc-cell__guide--ancestor${isLastRendered ? ' nested-doc-cell__guide--last' : ''}`}
                key={level}
                style={{ '--guide-level': level } as React.CSSProperties}
              />
            ),
        )}
        {row.depth === 0 ? (
          <span className="nested-doc-cell__guide nested-doc-cell__guide--root" />
        ) : (
          <span
            className={`nested-doc-cell__guide nested-doc-cell__guide--elbow${row.isLastSibling || isLastRendered ? ' nested-doc-cell__guide--last' : ''}`}
            style={{ '--guide-level': row.depth - 1 } as React.CSSProperties}
          />
        )}
        {row.isExpanded && row.hasChildren && !isLastRendered && (
          <span
            className="nested-doc-cell__guide nested-doc-cell__guide--stem"
            style={{ '--guide-level': row.depth } as React.CSSProperties}
          />
        )}
      </span>
      {row.hasChildren ? (
        <button
          aria-disabled={(!onToggle && !tree) || undefined}
          aria-expanded={row.isExpanded}
          aria-label={`${t(row.isExpanded ? 'general:collapse' : 'general:expand')}: ${title}`}
          className="nested-doc-cell__toggle"
          onClick={() => (onToggle ? onToggle() : tree?.toggle({ id }))}
          type="button"
        >
          <span aria-hidden="true">
            {shouldShowSpinner ? (
              <SpinnerIcon size="sm" />
            ) : (
              <ChevronIcon direction={row.isExpanded ? 'down' : 'right'} size={16} />
            )}
          </span>
        </button>
      ) : (
        <span aria-hidden="true" className="nested-doc-cell__spacer" />
      )}
      {parentTitle !== undefined && (
        <span className="sr-only">{`${t('general:parentDocument')}: ${parentTitle}. `}</span>
      )}
      {children}
    </div>
  )
}
