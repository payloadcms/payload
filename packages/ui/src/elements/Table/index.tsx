'use client'

import type { Column, NestedDocRow, Sort } from 'payload'

import React, { useRef } from 'react'

import { useGridNavigation } from './GridNavigation/useGridNavigation.js'
import { NestedDocRow } from './NestedDocRow/index.js'
import { TableGridContext, useTableID, useTableNavigationLabel } from './TableIdentity.js'
import { TableRow } from './TableRow/index.js'
import './index.css'

const baseClass = 'table'

export type Props = {
  readonly appearance?: 'condensed' | 'default'
  readonly ariaLabel?: string
  readonly BeforeTable?: React.ReactNode
  readonly columns?: Column[]
  readonly data: Record<string, unknown>[]
  readonly id?: string
  readonly navigationLabel?: string
  readonly nestedDocs?: {
    collectionSlug: string
    rows: Record<string, NestedDocRow>
    sort?: Sort
  }
  readonly useAsTitle?: string
}

export const Table: React.FC<Props> = ({
  id,
  appearance,
  ariaLabel,
  BeforeTable,
  columns,
  data,
  navigationLabel: navigationLabelFromProps,
  nestedDocs,
  useAsTitle,
}) => {
  const tableID = useTableID(id)
  const navigationLabelFromContext = useTableNavigationLabel()
  const navigationLabel = navigationLabelFromProps ?? navigationLabelFromContext
  const tableRef = useRef<HTMLTableElement>(null)
  const isGrid = Boolean(navigationLabel)

  const activeColumns = columns?.filter((col) => col?.active)
  const hasRowSelection = isGrid && activeColumns?.some((column) => column.accessor === '_select')

  useGridNavigation({ id, isEnabled: isGrid && Boolean(activeColumns?.length), ref: tableRef })

  if (!activeColumns || activeColumns.length === 0) {
    return <div>No columns selected</div>
  }

  return (
    <div
      className={[baseClass, appearance && `${baseClass}--appearance-${appearance}`]
        .filter(Boolean)
        .join(' ')}
    >
      {BeforeTable}
      <TableGridContext value={isGrid}>
        <table
          aria-label={ariaLabel ?? navigationLabel}
          aria-multiselectable={hasRowSelection || undefined}
          cellPadding="0"
          cellSpacing="0"
          id={tableID}
          ref={tableRef}
          role={isGrid ? 'grid' : undefined}
        >
          <thead>
            <tr role={isGrid ? 'row' : undefined}>
              {activeColumns.map((col) => (
                <th
                  data-column={col.accessor}
                  id={`heading-${col.accessor.replace(/\./g, '__')}`}
                  key={col.accessor}
                  role={isGrid ? 'columnheader' : undefined}
                  scope="col"
                >
                  {col.Heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.map((row, rowIndex) => {
              const key =
                typeof row.id === 'string' || typeof row.id === 'number' ? String(row.id) : rowIndex
              const metadata = nestedDocs?.rows[String(row.id)]

              return nestedDocs && metadata ? (
                <NestedDocRow
                  collectionSlug={nestedDocs.collectionSlug}
                  columns={activeColumns}
                  hasCellNavigation={isGrid}
                  hasRowSelection={Boolean(hasRowSelection)}
                  key={`${key}:${String(nestedDocs.sort)}`}
                  row={row}
                  rowIndex={rowIndex}
                  rowMetadata={metadata}
                  sort={nestedDocs.sort}
                  useAsTitle={useAsTitle}
                />
              ) : (
                <TableRow
                  columns={activeColumns}
                  hasCellNavigation={isGrid}
                  hasRowSelection={Boolean(hasRowSelection)}
                  key={key}
                  row={row}
                  rowIndex={rowIndex}
                />
              )
            })}
          </tbody>
        </table>
      </TableGridContext>
    </div>
  )
}
