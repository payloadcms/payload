'use client'

import React from 'react'

import { CheckboxInput } from '../../../fields/Checkbox/Input.js'
import { DragHandleIcon } from '../../../icons/DragHandle/index.js'
import './SlotTable.scss'

const baseClass = 'slot-table'

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
      className={[baseClass, appearance && `${baseClass}--appearance-${appearance}`, className]
        .filter(Boolean)
        .join(' ')}
      key={`${collectionSlug}-${parentId}`}
    >
      <table cellPadding="0" cellSpacing="0">
        {enableHeader && (
          <thead>
            <tr>
              {enableDragHandle && (
                <th className={`${baseClass}__th ${baseClass}__th--drag`}>
                  <span className={`${baseClass}__drag-header`} />
                </th>
              )}
              {enableCheckbox && (
                <th className={`${baseClass}__th ${baseClass}__th--checkbox`}>
                  {enableSelectAll && (
                    <CheckboxInput
                      checked={allSelected}
                      className={`${baseClass}__checkbox`}
                      onToggle={handleSelectAll}
                      partialChecked={someSelected && !allSelected}
                    />
                  )}
                </th>
              )}
              {columns.map((col) => (
                <th
                  className={[`${baseClass}__th`, col.className].filter(Boolean).join(' ')}
                  key={col.accessor}
                >
                  {col.heading}
                </th>
              ))}
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
                className={[
                  `${baseClass}__tr`,
                  isSelected && `${baseClass}__tr--selected`,
                  isClickable && `${baseClass}__tr--clickable`,
                ]
                  .filter(Boolean)
                  .join(' ')}
                data-id={rowId}
                key={rowId}
                onClick={isClickable ? () => handleRowClick(row, rowIndex) : undefined}
                onKeyDown={isClickable ? (e) => handleRowKeyDown(row, rowIndex, e) : undefined}
                tabIndex={isClickable ? 0 : undefined}
              >
                {enableDragHandle && (
                  <td className={`${baseClass}__td ${baseClass}__td--drag`}>
                    <span className={`${baseClass}__drag-handle`}>
                      <DragHandleIcon />
                    </span>
                  </td>
                )}
                {enableCheckbox && (
                  <td className={`${baseClass}__td ${baseClass}__td--checkbox`}>
                    <CheckboxInput
                      checked={isSelected}
                      className={`${baseClass}__checkbox`}
                      onToggle={() => handleRowCheckbox(row, rowIndex, isSelected)}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    className={[`${baseClass}__td`, col.className].filter(Boolean).join(' ')}
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
