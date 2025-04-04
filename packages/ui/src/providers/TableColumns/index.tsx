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

  const setActiveColumns = useCallback(
    async (columns: string[]) => {
      await refineListData({ columns })
    },
    [refineListData],
  )

  const resetColumnsState = React.useCallback(async () => {
    await setActiveColumns(defaultColumns)
  }, [defaultColumns, setActiveColumns])

  return (
    <TableColumnContext
      value={{
        columns: columnState,
        LinkedCellOverride,
        moveColumn,
        resetColumnsState,
        setActiveColumns,
        toggleColumn,
        ...contextRef.current,
      }}
    >
      {children}
    </TableColumnContext>
  )
}
