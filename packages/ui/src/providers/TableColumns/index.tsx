'use client'
import { type Column } from 'payload'
import { transformColumnsToSearchParams } from 'payload/shared'
import React, { startTransition, useCallback, useEffect, useRef } from 'react'

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

  // Sync optimistic state when props change (e.g., after preset reset)
  const prevPropsRef = useRef(columnStateFromProps)
  useEffect(() => {
    if (columnStateFromProps !== prevPropsRef.current) {
      prevPropsRef.current = columnStateFromProps
      // Force optimistic state to sync with new props by triggering a transition
      startTransition(() => {
        setOptimisticColumnState(columnStateFromProps)
      })
    }
  }, [columnStateFromProps, setOptimisticColumnState])

  const contextRef = useRef({} as ITableColumns)

  const toggleColumn = useCallback(
    async (column: string) => {
      const currentColumns = columnState || []
      const columnIndex = currentColumns.findIndex((col) => col.accessor === column)

      if (columnIndex === -1) {
        return
      }

      const targetColumn = currentColumns[columnIndex]
      const isBeingShown = !targetColumn.active

      let newColumnState: typeof currentColumns

      if (isBeingShown) {
        // When showing a column, move it to the end of shown columns
        const otherColumns = currentColumns.filter((col) => col.accessor !== column)
        const shownColumns = otherColumns.filter((col) => col.active)
        const hiddenColumns = otherColumns.filter((col) => !col.active)
        newColumnState = [...shownColumns, { ...targetColumn, active: true }, ...hiddenColumns]
      } else {
        // When hiding a column, just toggle it in place
        newColumnState = currentColumns.map((col) => {
          if (col.accessor === column) {
            return { ...col, active: false }
          }
          return col
        })
      }

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

  const setActiveColumns = useCallback(
    async (columns: string[]) => {
      const newColumnState = currentQuery.columns

      columns.forEach((colName) => {
        const colIndex = newColumnState.findIndex((c) => colName === c)

        // ensure the name does not begin with a `-` which denotes an inactive column
        if (colIndex !== undefined && newColumnState[colIndex][0] === '-') {
          newColumnState[colIndex] = colName.slice(1)
        }
      })

      await refineListData({ columns: newColumnState })
    },
    [currentQuery, refineListData],
  )

  const resetColumnsState = React.useCallback(async () => {
    await refineListData({ columns: defaultColumns || [] })
  }, [defaultColumns, refineListData])

  const setColumns = useCallback(
    async (newColumns: Column[]) => {
      startTransition(() => {
        setOptimisticColumnState(newColumns)
      })

      await refineListData({
        columns: transformColumnsToSearchParams(newColumns),
      })
    },
    [refineListData, setOptimisticColumnState],
  )

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
