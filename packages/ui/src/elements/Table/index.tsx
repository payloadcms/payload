'use client'

import type { Column } from 'payload'

import React, { useRef } from 'react'

import { useSelection } from '../../providers/Selection/index.js'
import { useGridNavigation } from './GridNavigation/useGridNavigation.js'
import { TableGridContext, useTableID, useTableNavigationLabel } from './TableIdentity.js'
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
}

export const Table: React.FC<Props> = ({
  id,
  appearance,
  ariaLabel,
  BeforeTable,
  columns,
  data,
  navigationLabel: navigationLabelFromProps,
}) => {
  const tableID = useTableID(id)
  const navigationLabelFromContext = useTableNavigationLabel()
  const navigationLabel = navigationLabelFromProps ?? navigationLabelFromContext
  const tableRef = useRef<HTMLTableElement>(null)
  const isGrid = Boolean(navigationLabel)
  const { selected } = useSelection()

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
            {data &&
              data?.map((row, rowIndex) => {
                return (
                  <tr
                    aria-label={isGrid ? String(rowIndex + 1) : undefined}
                    aria-selected={
                      hasRowSelection
                        ? Boolean(
                            (typeof row.id === 'string' || typeof row.id === 'number') &&
                              selected.get(row.id),
                          )
                        : undefined
                    }
                    className={`row-${rowIndex + 1}`}
                    data-id={row.id}
                    key={
                      typeof row.id === 'string' || typeof row.id === 'number'
                        ? String(row.id)
                        : rowIndex
                    }
                    role={isGrid ? 'row' : undefined}
                  >
                    {activeColumns.map((col) => {
                      const { accessor } = col

                      return (
                        <td
                          className={[
                            `cell-${accessor.replace(/\./g, '__')}`,
                            col.isLinkedColumn && 'cell--linked',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          data-column={accessor}
                          key={accessor}
                          role={isGrid ? 'gridcell' : undefined}
                        >
                          {col.renderedCells[rowIndex]}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
          </tbody>
        </table>
      </TableGridContext>
    </div>
  )
}
