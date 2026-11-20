'use client'

import type { Column, NestedDocRow, Sort } from 'payload'

import React, { useState } from 'react'

import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { SpinnerIcon } from '../../../icons/Spinner/index.js'
import { useServerFunctions } from '../../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { TableRow } from '../TableRow/index.js'
import './index.css'

export function NestedDocsBranchRow({
  collectionSlug,
  columns,
  hasCellNavigation,
  hasRowSelection,
  row,
  rowIndex,
  rowMetadata,
  sort,
  useAsTitle,
}: {
  collectionSlug: string
  columns: Column[]
  hasCellNavigation: boolean
  hasRowSelection: boolean
  row: Record<string, unknown>
  rowIndex: number
  rowMetadata: NestedDocRow
  sort?: Sort
  useAsTitle?: string
}) {
  const { getTableState } = useServerFunctions()
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [branch, setBranch] = useState<{
    columns: Column[]
    docs: Record<string, unknown>[]
  }>()
  const titleColumn =
    columns.find((column) => column.isLinkedColumn) ??
    columns.find((column) => column.accessor !== '_select')
  const rowID = row.id as number | string
  const titleValue = useAsTitle ? row[useAsTitle] : rowID
  const title = String(titleValue ?? rowID)

  const toggle = async () => {
    if (isExpanded && !hasError) {
      setIsExpanded(false)
      return
    }

    setIsExpanded(true)
    if (branch) {
      return
    }

    setIsPending(true)
    setHasError(false)
    try {
      const result = await getTableState({
        collectionSlug,
        columns: columns.map(({ accessor, active }) => ({ accessor, active })),
        enableRowSelections: false,
        nestedDocs: { parentID: rowID },
        orderableFieldName: '',
        query: { limit: rowMetadata.limit, page: 1, sort },
      })

      if (!result?.data || !result.state) {
        throw new Error('Invalid branch response')
      }

      setBranch({ columns: result.state, docs: result.data.docs })
    } catch {
      setHasError(true)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <TableRow
        columns={columns}
        hasCellNavigation={hasCellNavigation}
        hasRowSelection={hasRowSelection}
        renderCell={({ column }) =>
          column === titleColumn ? (
            <div className="nested-docs-branch-row__title">
              {rowMetadata.hasChildren && (
                <button
                  aria-expanded={isExpanded}
                  aria-label={`${t(hasError ? 'general:retry' : isExpanded ? 'general:collapse' : 'general:expand')}: ${title}`}
                  className="nested-docs-branch-row__toggle"
                  disabled={isPending}
                  onClick={toggle}
                  type="button"
                >
                  {isPending ? (
                    <SpinnerIcon size="sm" />
                  ) : (
                    <ChevronIcon direction={isExpanded ? 'down' : 'right'} size={16} />
                  )}
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
      {isExpanded &&
        branch?.docs.map((child, childIndex) => (
          <TableRow
            columns={columns}
            hasCellNavigation={hasCellNavigation}
            key={String(child.id)}
            renderCell={({ column }) => {
              const branchColumn = branch.columns.find((item) => item.accessor === column.accessor)
              const cell = branchColumn?.renderedCells[childIndex]

              return column === titleColumn ? (
                <div className="nested-docs-branch-row__child">{cell}</div>
              ) : (
                cell
              )
            }}
            row={child}
            rowIndex={childIndex}
          />
        ))}
    </>
  )
}
