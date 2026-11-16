'use client'

import type { HierarchyContentsSource } from 'payload'

import React from 'react'

import type { TreePosition } from '../../../../elements/Tree/types.js'

import { TreeItem } from '../../../../elements/Tree/TreeItem/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'

export function ContentsAction({
  action,
  hasAction,
  hasError,
  hasRowSelections,
  isPending,
  isSummary,
  label,
  onLoadMore,
  parentTitle,
  position,
  sourceData,
}: {
  action: string
  hasAction: boolean
  hasError: boolean
  hasRowSelections: boolean
  isPending: boolean
  isSummary: boolean
  label: string
  onLoadMore: (args: { control: HTMLElement }) => void
  parentTitle?: string
  position: TreePosition
  sourceData?: HierarchyContentsSource
}) {
  const { t } = useTranslation()

  return (
    <tr
      className={`hierarchy-contents-tree__action${isSummary ? ' hierarchy-contents-tree__summary' : ''}`}
    >
      {hasRowSelections && <td data-column="_select" />}
      <td className="cell--linked">
        <TreeItem position={position} variant="continuation">
          <div className="hierarchy-contents-tree__action-content">
            {isSummary && sourceData && (
              <span role="status">
                {sourceData.docs.length} {t('general:of')} {sourceData.totalDocs} {label}
              </span>
            )}
            {isPending && (
              <span className="sr-only" role="status">{`${t('general:loading')}: ${label}`}</span>
            )}
            {hasError && <span role="alert">{t('error:loadingItems')}</span>}
            {hasAction && (
              <>
                {isSummary && <span aria-hidden="true">—</span>}
                <button
                  aria-disabled={isPending || undefined}
                  aria-label={`${action}: ${label}${parentTitle ? ` (${parentTitle})` : ''}`}
                  onClick={(event) => {
                    if (!isPending) {
                      onLoadMore({ control: event.currentTarget })
                    }
                  }}
                  type="button"
                >
                  {action}
                </button>
              </>
            )}
          </div>
        </TreeItem>
      </td>
      <td />
      <td />
    </tr>
  )
}
