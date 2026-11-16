'use client'

import type { Column, User } from 'payload'

import React from 'react'

import { useAuth } from '../../../providers/Auth/index.js'
import { useSelection } from '../../../providers/Selection/index.js'

export type TableRowProps = {
  columns: Column[]
  hasRowSelection?: boolean
  isGrid: boolean
  renderCell?: (args: { column: Column }) => React.ReactNode
  row: Record<string, unknown>
  rowIndex: number
}

export function TableRow({
  columns,
  hasRowSelection,
  isGrid,
  renderCell,
  row,
  rowIndex,
}: TableRowProps) {
  const { user } = useAuth()
  const { selected } = useSelection()
  const userEditing = row._userEditing as undefined | User
  const isLockedByAnotherUser = row._isLocked && userEditing && userEditing.id !== user?.id

  return (
    <tr
      aria-label={isGrid ? String(rowIndex + 1) : undefined}
      aria-selected={
        hasRowSelection && !isLockedByAnotherUser
          ? Boolean(
              (typeof row.id === 'string' || typeof row.id === 'number') && selected.get(row.id),
            )
          : undefined
      }
      className={`row-${rowIndex + 1}`}
      data-id={row.id}
      role={isGrid ? 'row' : undefined}
    >
      {columns.map((column) => (
        <td
          className={[
            `cell-${column.accessor.replace(/\./g, '__')}`,
            column.isLinkedColumn && 'cell--linked',
          ]
            .filter(Boolean)
            .join(' ')}
          data-column={column.accessor}
          key={column.accessor}
          role={isGrid ? 'gridcell' : undefined}
        >
          {renderCell ? renderCell({ column }) : column.renderedCells[rowIndex]}
        </td>
      ))}
    </tr>
  )
}
