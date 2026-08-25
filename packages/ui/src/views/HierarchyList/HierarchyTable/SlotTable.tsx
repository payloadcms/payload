'use client'

import type { User } from 'payload'

import React from 'react'

import { Locked } from '../../../elements/Locked/index.js'
import { CheckboxInput } from '../../../fields/Checkbox/Input.js'
import { AlignJustifiedIcon } from '../../../icons/AlignJustified/index.js'
// Rows adopt the shared table's class contract (`cell--linked`, `cell-_select`, ...) so the
// styling lives in one place; this file only adds what the slot API needs on top.
import '../../../elements/Table/index.css'
import './SlotTable.css'

const baseClass = 'slot-table'

/** Matches what SelectRow renders, so the shared row-selected background rule applies here too. */
const selectRowClass = 'select-row select-row__checkbox'

export type SlotColumn<TRow = Record<string, unknown>> = {
  /**
   * Unique identifier for the column
   */
  accessor: string
  /**
   * Cell component that receives the row data
   */
  Cell: React.FC<{ column: SlotColumn<TRow>; row: TRow; rowIndex: number }>
  /**
   * Optional class name for the column cells
   */
  className?: string
  /**
   * Column header content
   */
  heading: React.ReactNode
  /**
   * Marks the column as the row's link to its document, so the cell adopts the shared
   * `cell--linked` treatment: padding moves onto the anchor for a full-cell click target.
   */
  isLinked?: boolean
}

export type SlotTableProps<TRow = Record<string, unknown>> = {
  /**
   * Table appearance
   */
  appearance?: 'condensed' | 'default'
  /**
   * Additional class name
   */
  className?: string
  /**
   * Collection slug for the table
   */
  collectionSlug?: string
  /**
   * Column definitions with Cell components
   */
  columns: SlotColumn<TRow>[]
  /**
   * Data array - table loops over this
   */
  data: TRow[]
  /**
   * Show checkbox column (default: true)
   */
  enableCheckbox?: boolean
  /**
   * Show drag handle column (default: true)
   */
  enableDragHandle?: boolean
  /**
   * Show header row with column headings (default: true)
   */
  enableHeader?: boolean
  /**
   * Show select-all checkbox in header (default: true, requires enableCheckbox and enableHeader)
   */
  enableSelectAll?: boolean
  /**
   * Get unique ID for each row
   */
  getRowId?: (row: TRow, index: number) => number | string
  /**
   * Returns the user who is editing/locking a row, or undefined if not locked.
   * When a user is returned, a lock icon replaces the checkbox for that row.
   */
  getRowLockedUser?: (row: TRow, index: number) => undefined | User
  /**
   * Merge checkbox header with first column header using colspan (default: false)
   * The first column header will span both checkbox and content cells
   */
  mergeCheckboxHeader?: boolean
  /**
   * Callback when checkbox is toggled
   */
  onCheckboxChange?: (row: TRow, checked: boolean, index: number) => void
  /**
   * Row click handler (for navigation)
   */
  onRowClick?: (row: TRow, index: number) => void
  /**
   * Callback when "select all" checkbox is toggled
   */
  onSelectAllChange?: (checked: boolean) => void
  /**
   * Parent ID for the table
   */
  parentId?: null | number | string
  /**
   * Currently selected row IDs
   */
  selectedIds?: Set<number | string>
}

export function SlotTable<TRow extends Record<string, unknown> = Record<string, unknown>>({
  appearance = 'default',
  className,
  collectionSlug,
  columns,
  data,
  enableCheckbox = true,
  enableDragHandle = true,
  enableHeader = true,
  enableSelectAll = true,
  getRowId = (row, index) => (row.id as number | string) ?? index,
  getRowLockedUser,
  mergeCheckboxHeader = false,
  onCheckboxChange,
  onRowClick,
  onSelectAllChange,
  parentId,
  selectedIds = new Set(),
}: SlotTableProps<TRow>) {
  const allSelected = data.length > 0 && data.every((row, i) => selectedIds.has(getRowId(row, i)))
  const someSelected = data.some((row, i) => selectedIds.has(getRowId(row, i)))

  const handleSelectAll = () => {
    onSelectAllChange?.(!allSelected)
  }

  const handleRowCheckbox = (row: TRow, index: number, isSelected: boolean) => {
    onCheckboxChange?.(row, !isSelected, index)
  }

  const handleRowClick = (row: TRow, index: number) => {
    onRowClick?.(row, index)
  }

  const handleRowKeyDown = (row: TRow, index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onRowClick?.(row, index)
    }
  }

  return (
    <div
      className={['table', appearance && `table--appearance-${appearance}`, baseClass, className]
        .filter(Boolean)
        .join(' ')}
      key={`${collectionSlug}-${parentId}`}
    >
      <table cellPadding="0" cellSpacing="0">
        {enableHeader && (
          <thead>
            <tr>
              {enableCheckbox && !mergeCheckboxHeader && (
                <th id="heading-_select">
                  {enableSelectAll && (
                    <CheckboxInput
                      checked={allSelected}
                      className={selectRowClass}
                      onToggle={handleSelectAll}
                      partialChecked={someSelected && !allSelected}
                    />
                  )}
                </th>
              )}
              {enableDragHandle && (
                <th id="heading-_dragHandle">
                  <span className={`${baseClass}__drag-header`} />
                </th>
              )}
              {columns.map((col, colIndex) => {
                const isMergedCheckboxColumn =
                  colIndex === 0 && enableCheckbox && mergeCheckboxHeader

                return (
                  <th
                    className={col.className}
                    colSpan={isMergedCheckboxColumn ? 2 : undefined}
                    id={`heading-${col.accessor}`}
                    key={col.accessor}
                  >
                    {isMergedCheckboxColumn && enableSelectAll ? (
                      <span className={`${baseClass}__th-merged`}>
                        <CheckboxInput
                          checked={allSelected}
                          className={selectRowClass}
                          onToggle={handleSelectAll}
                          partialChecked={someSelected && !allSelected}
                        />
                        {col.heading}
                      </span>
                    ) : (
                      col.heading
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
        )}
        <tbody>
          {data.map((row, rowIndex) => {
            const rowId = getRowId(row, rowIndex)
            const isSelected = selectedIds.has(rowId)
            const isClickable = Boolean(onRowClick)

            return (
              <tr
                className={isClickable ? `${baseClass}__tr--clickable` : undefined}
                data-id={rowId}
                key={rowId}
                onClick={isClickable ? () => handleRowClick(row, rowIndex) : undefined}
                onKeyDown={isClickable ? (e) => handleRowKeyDown(row, rowIndex, e) : undefined}
                tabIndex={isClickable ? 0 : undefined}
              >
                {enableCheckbox && (
                  <td className="cell-_select">
                    {(() => {
                      const lockedUser = getRowLockedUser?.(row, rowIndex)

                      if (lockedUser) {
                        return <Locked user={lockedUser} />
                      }

                      return (
                        <CheckboxInput
                          checked={isSelected}
                          className={selectRowClass}
                          onToggle={() => handleRowCheckbox(row, rowIndex, isSelected)}
                        />
                      )
                    })()}
                  </td>
                )}
                {enableDragHandle && (
                  <td className="cell-_dragHandle">
                    <span className={`${baseClass}__drag-handle`}>
                      <AlignJustifiedIcon />
                    </span>
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    className={[
                      `cell-${col.accessor}`,
                      col.isLinked && 'cell--linked',
                      col.className,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    key={col.accessor}
                  >
                    <col.Cell column={col} row={row} rowIndex={rowIndex} />
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
