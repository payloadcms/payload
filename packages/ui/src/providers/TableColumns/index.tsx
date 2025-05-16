'use client'
import { type Column } from 'payload'
import { transformColumnsToSearchParams } from 'payload/shared'
import React, { startTransition, useCallback, useRef } from 'react'

import type { ITableColumns, TableColumnsProviderProps } from './types.js'

import { useConfig } from '../../providers/Config/index.js'
import { useListQuery } from '../../providers/ListQuery/index.js'
import { TableColumnContext } from './context.js'

export { useTableColumns } from './context.js'

export const TableColumnsProvider: React.FC<TableColumnsProviderProps> = ({
  children,
  collectionSlug,
  columnState: columnStateFromProps,
  LinkedCellOverride,
}) => {
  const { getEntityConfig } = useConfig()
  const { query: currentQuery, refineListData } = useListQuery()

  const { admin: { defaultColumns } = {} } = getEntityConfig({
    collectionSlug,
  })

  const [columnState, setOptimisticColumnState] = React.useOptimistic(
    columnStateFromProps,
    (state, action: Column[]) => action,
  )

  const contextRef = useRef({} as ITableColumns)

  const toggleColumn = useCallback(
    async (column: string) => {
      const newColumnState = (columnState || []).map((col) => {
        if (col.accessor === column) {
          return { ...col, active: !col.active }
        }
        return col
      })

      startTransition(() => {
        setOptimisticColumnState(newColumnState)
      })

      await refineListData({
        columns: transformColumnsToSearchParams(newColumnState),
      })
    },
    [refineListData, columnState, setOptimisticColumnState],
  )

  const moveColumn = useCallback(
    async (args: { fromIndex: number; toIndex: number }) => {
      const { fromIndex, toIndex } = args
      const newColumnState = [...(columnState || [])]
      const [columnToMove] = newColumnState.splice(fromIndex, 1)
      newColumnState.splice(toIndex, 0, columnToMove)

      startTransition(() => {
        setOptimisticColumnState(newColumnState)
      })

      await refineListData({
        columns: transformColumnsToSearchParams(newColumnState),
      })
    },
    [columnState, refineListData, setOptimisticColumnState],
  )

  const setColumns = useCallback(
    async (columns: string[]) => {
      await refineListData({ columns })
    },
    [refineListData],
  )

  /**
   * Sets specified columns to active state while preserving important properties:
   * 1. Maintains the original column order from the current query
   * 2. Preserves the active state of columns not mentioned in the input array
   * 3. Only changes the active state of columns specified in the input array
   *
   * This is different from `setColumns` which replaces the entire column list
   * and changes both the order and active states.
   *
   * @deprecated Use setColumns instead if you want to replace all columns
   */
  const setActiveColumns = useCallback(
    async (columns: string[]) => {
      // Get current columns from the query
      const currentColumns = currentQuery?.columns || []

      // Create a new columns array based on the current column order
      // but set specified columns to active
      const updatedColumns = currentColumns.map((col) => {
        const colName = col.startsWith('-') ? col.slice(1) : col
        // Only modify active state if the column is in the input array
        const shouldModify = columns.includes(colName)

        if (shouldModify) {
          // Make active if in the input array
          return colName
        } else {
          // Otherwise keep its current state
          return col
        }
      })

      await refineListData({ columns: updatedColumns })
    },
    [currentQuery, refineListData],
  )

  const resetColumnsState = React.useCallback(async () => {
    await setColumns(defaultColumns || [])
  }, [defaultColumns, setColumns])

  return (
    <TableColumnContext
      value={{
        columns: columnState,
        LinkedCellOverride,
        moveColumn,
        resetColumnsState,
        setActiveColumns,
        setColumns,
        toggleColumn,
        ...contextRef.current,
      }}
    >
      {children}
    </TableColumnContext>
  )
}
