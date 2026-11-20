'use client'

import type { Column, NestedDocRow } from 'payload'

import React from 'react'

import { useNestedDocsTree } from '../../../providers/NestedDocs/index.js'
import { NestedDocCell } from '../NestedDocCell/index.js'
import { TableRow } from '../TableRow/index.js'

export function NestedDocsBranchRow({
  columns,
  hasCellNavigation,
  hasRowSelection,
  isLastRendered,
  row,
  rowIndex,
  rowMetadata,
  useAsTitle,
}: {
  columns: Column[]
  hasCellNavigation: boolean
  hasRowSelection: boolean
  isLastRendered: boolean
  row: Record<string, unknown>
  rowIndex: number
  rowMetadata: NestedDocRow
  useAsTitle?: string
}) {
  const tree = useNestedDocsTree()
  const titleColumn =
    columns.find((column) => column.isLinkedColumn) ??
    columns.find((column) => column.accessor !== '_select')
  const rowID = row.id as number | string
  const titleValue = useAsTitle ? row[useAsTitle] : rowID
  const title =
    typeof titleValue === 'string' || typeof titleValue === 'number'
      ? String(titleValue)
      : String(rowID)
  const parent = tree?.docs.find((doc) => String(doc.id) === String(rowMetadata.parentID))
  const parentTitleValue = parent && useAsTitle ? parent[useAsTitle] : undefined
  const parentTitle =
    typeof parentTitleValue === 'string' || typeof parentTitleValue === 'number'
      ? String(parentTitleValue)
      : undefined

  return (
    <TableRow
      columns={columns}
      hasCellNavigation={hasCellNavigation}
      hasRowSelection={hasRowSelection}
      renderCell={({ column }) =>
        column === titleColumn ? (
          <NestedDocCell
            id={String(rowID)}
            isLastRendered={isLastRendered}
            parentTitle={parentTitle}
            row={rowMetadata}
            title={title}
          >
            {column.renderedCells[rowIndex]}
          </NestedDocCell>
        ) : (
          column.renderedCells[rowIndex]
        )
      }
      row={row}
      rowIndex={rowIndex}
    />
  )
}
