'use client'

import type { NestedDocRow as NestedDocRowData } from 'payload'

import React from 'react'

import type { TableRowProps } from '../TableRow/index.js'

import { useNestedDocsTree } from '../../../providers/NestedDocs/index.js'
import { branchKey } from '../../../providers/NestedDocs/state.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { SelectRow } from '../../SelectRow/index.js'
import { NestedDocCell } from '../NestedDocCell/index.js'
import { NestedDocsContinuationRow } from '../NestedDocsContinuationRow/index.js'
import { TableRow } from '../TableRow/index.js'

export function NestedDocRow({
  columns,
  documentsByID,
  hasRowSelection,
  isGrid,
  isLastDocument,
  label,
  row,
  rowIndex,
  rows,
  useAsTitle,
}: {
  documentsByID?: Map<unknown, Record<string, unknown>>
  isLastDocument: boolean
  label?: string
  rows: Record<string, NestedDocRowData>
  useAsTitle?: string
} & Omit<TableRowProps, 'renderCell'>) {
  const tree = useNestedDocsTree()
  const { t } = useTranslation()
  const rowID = typeof row.id === 'string' || typeof row.id === 'number' ? row.id : rowIndex
  const titleValue = useAsTitle ? row[useAsTitle] : undefined
  const title =
    typeof titleValue === 'string' || typeof titleValue === 'number'
      ? String(titleValue)
      : String(rowID)
  const parentID = rows[String(rowID)]?.parentID
  const parent =
    parentID === null || parentID === undefined ? undefined : documentsByID?.get(parentID)
  const parentValue = useAsTitle ? parent?.[useAsTitle] : undefined
  const parentTitle = parent
    ? typeof parentValue === 'string' || typeof parentValue === 'number'
      ? String(parentValue)
      : String(parentID)
    : undefined
  const titleColumn =
    columns.find((column) => column.isLinkedColumn) ??
    columns.find((column) => column.accessor !== '_select')

  return (
    <>
      <TableRow
        columns={columns}
        hasRowSelection={hasRowSelection}
        isGrid={isGrid}
        renderCell={({ column }) =>
          tree && column.accessor === '_select' ? (
            <SelectRow
              rowData={{ ...row, id: rowID }}
              rowIndex={rowIndex}
              selectRowLabel={t('general:selectLabel', { label: title })}
            />
          ) : rows[String(rowID)] && column === titleColumn ? (
            <NestedDocCell
              id={String(rowID)}
              isLastRendered={isLastDocument && !tree?.continuationsByRowID.has(String(rowID))}
              parentTitle={parentTitle}
              row={rows[String(rowID)]}
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
      {(tree?.continuationsByRowID.get(String(rowID)) ?? []).map((parentID) => {
        const parent =
          parentID === null
            ? undefined
            : tree?.docs.find((doc) => String(doc.id) === String(parentID))
        const value = useAsTitle ? parent?.[useAsTitle] : undefined
        const parentLabel =
          typeof value === 'string' || typeof value === 'number'
            ? String(value)
            : parentID === null
              ? (label ?? t('general:treeLayout'))
              : String(parentID)

        return (
          <NestedDocsContinuationRow
            columns={columns}
            isGrid={isGrid}
            key={`load-${branchKey({ parentID })}`}
            label={parentLabel}
            parentID={parentID}
            titleColumn={titleColumn?.accessor}
          />
        )
      })}
    </>
  )
}
