'use client'

import type { Column, NestedDocRow } from 'payload'

import React from 'react'

import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { SpinnerIcon } from '../../../icons/Spinner/index.js'
import { useNestedDocsTree } from '../../../providers/NestedDocs/index.js'
import { branchKey } from '../../../providers/NestedDocs/state.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { TableRow } from '../TableRow/index.js'
import './index.css'

export function NestedDocsBranchRow({
  columns,
  hasCellNavigation,
  hasRowSelection,
  row,
  rowIndex,
  rowMetadata,
  useAsTitle,
}: {
  columns: Column[]
  hasCellNavigation: boolean
  hasRowSelection: boolean
  row: Record<string, unknown>
  rowIndex: number
  rowMetadata: NestedDocRow
  useAsTitle?: string
}) {
  const tree = useNestedDocsTree()
  const { t } = useTranslation()
  const titleColumn =
    columns.find((column) => column.isLinkedColumn) ??
    columns.find((column) => column.accessor !== '_select')
  const rowID = row.id as number | string
  const titleValue = useAsTitle ? row[useAsTitle] : rowID
  const title =
    typeof titleValue === 'string' || typeof titleValue === 'number'
      ? String(titleValue)
      : String(rowID)
  const isPending = tree?.pending.has(branchKey({ parentID: rowID })) ?? false

  return (
    <TableRow
      columns={columns}
      hasCellNavigation={hasCellNavigation}
      hasRowSelection={hasRowSelection}
      renderCell={({ column }) =>
        column === titleColumn ? (
          <div
            className="nested-docs-branch-row__title"
            style={{ paddingInlineStart: `calc(var(--spacer-4) * ${rowMetadata.depth})` }}
          >
            {rowMetadata.hasChildren && (
              <button
                aria-busy={isPending}
                aria-expanded={rowMetadata.isExpanded}
                aria-label={`${t(rowMetadata.isExpanded ? 'general:collapse' : 'general:expand')}: ${title}`}
                className="nested-docs-branch-row__toggle"
                onClick={() => tree?.toggle({ id: String(rowID) })}
                type="button"
              >
                <span aria-hidden="true">
                  {isPending ? (
                    <SpinnerIcon size="sm" />
                  ) : (
                    <ChevronIcon direction={rowMetadata.isExpanded ? 'down' : 'right'} size={16} />
                  )}
                </span>
              </button>
            )}
            {column.renderedCells[rowIndex]}
          </div>
        ) : (
          column.renderedCells[rowIndex]
        )
      }
      row={row}
      rowIndex={rowIndex}
    />
  )
}
