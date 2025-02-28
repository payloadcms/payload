'use client'
import { type Column } from 'payload'
import { transformColumnsToSearchParams } from 'payload/shared'
import React, { startTransition, useCallback, useRef } from 'react'

import type { ITableColumns, TableColumnsProviderProps } from './types.js'

import { useConfig } from '../../providers/Config/index.js'
import { useListQuery } from '../../providers/ListQuery/index.js'
import { TableColumnContext, TableColumnsModifiedContext } from './context.js'

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

  const [modified, setModified] = React.useState(false)

  const contextRef = useRef({} as ITableColumns)

  contextRef.current.modified = modified

  const toggleColumn = useCallback(
    async (column: string) => {
      setModified(true)

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
      setModified(true)

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
    async (columns: string[], shouldSetModified = true) => {
      if (shouldSetModified) {
        setModified(true)
      }

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
    await setActiveColumns(defaultColumns, false)
  }, [defaultColumns, setActiveColumns])

  return (
    <TableColumnContext.Provider
      value={{
        columns: columnState,
        LinkedCellOverride,
        modified,
        moveColumn,
        resetColumnsState,
        setActiveColumns,
        setModified,
        toggleColumn,
        ...contextRef.current,
      }}
    >
      <TableColumnsModifiedContext.Provider value={modified}>
        {children}
      </TableColumnsModifiedContext.Provider>
    </TableColumnContext.Provider>
  )
}
