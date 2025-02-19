'use client'
import type { Column, ListPreferences, SanitizedCollectionConfig } from 'payload'

import React, { useCallback, useEffect, useRef } from 'react'

import type { ITableColumns, TableColumnsProviderProps } from './types.js'

import { useConfig } from '../../providers/Config/index.js'
import { usePreferences } from '../../providers/Preferences/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { abortAndIgnore, handleAbortRef } from '../../utilities/abortAndIgnore.js'
import { TableColumnContext, TableColumnsModifiedContext } from './context.js'

export { useTableColumns } from './context.js'

// strip out Heading, Label, and renderedCells properties, they cannot be sent to the server
const sanitizeColumns = (columns: Column[]) => {
  return columns.map(({ accessor, active }) => ({
    accessor,
    active,
  }))
}

export const TableColumnsProvider: React.FC<TableColumnsProviderProps> = ({
  children,
  collectionSlug,
  columnState,
  docs,
  enableRowSelections,
  LinkedCellOverride,
  listPreferences,
  preferenceKey,
  renderRowTypes,
  setTable,
  sortColumnProps,
  tableAppearance,
}) => {
  const { getEntityConfig } = useConfig()

  const { getTableState } = useServerFunctions()

  const [modified, setModified] = React.useState(false)

  const contextRef = useRef({} as ITableColumns)

  contextRef.current.modified = modified

  const { admin: { defaultColumns, useAsTitle } = {}, fields } = getEntityConfig({
    collectionSlug,
  })

  const prevCollection = React.useRef<SanitizedCollectionConfig['slug']>(
    Array.isArray(collectionSlug) ? collectionSlug[0] : collectionSlug,
  )
  const { getPreference } = usePreferences()

  const [tableColumns, setTableColumns] = React.useState(columnState)
  const abortTableStateRef = React.useRef<AbortController>(null)
  const abortToggleColumnRef = React.useRef<AbortController>(null)

  const moveColumn = useCallback(
    async (args: { fromIndex: number; toIndex: number }) => {
      setModified(true)

      const controller = handleAbortRef(abortTableStateRef)

      const { fromIndex, toIndex } = args
      const withMovedColumn = [...tableColumns]
      const [columnToMove] = withMovedColumn.splice(fromIndex, 1)
      withMovedColumn.splice(toIndex, 0, columnToMove)

      setTableColumns(withMovedColumn)

      const result = await getTableState({
        collectionSlug,
        columns: sanitizeColumns(withMovedColumn),
        docs,
        enableRowSelections,
        renderRowTypes,
        signal: controller.signal,
        tableAppearance,
      })

      if (result) {
        setTableColumns(result.state)
        setTable(result.Table)
      }

      abortTableStateRef.current = null
    },
    [
      tableColumns,
      collectionSlug,
      docs,
      getTableState,
      setTable,
      enableRowSelections,
      renderRowTypes,
      tableAppearance,
    ],
  )

  const toggleColumn = useCallback(
    async (column: string) => {
      setModified(true)

      const controller = handleAbortRef(abortToggleColumnRef)

      const { newColumnState, toggledColumns } = tableColumns.reduce<{
        newColumnState: Column[]
        toggledColumns: Pick<Column, 'accessor' | 'active'>[]
      }>(
        (acc, col) => {
          if (col.accessor === column) {
            acc.newColumnState.push({
              ...col,
              accessor: col.accessor,
              active: !col.active,
            })
            acc.toggledColumns.push({
              accessor: col.accessor,
              active: !col.active,
            })
          } else {
            acc.newColumnState.push(col)
            acc.toggledColumns.push({
              accessor: col.accessor,
              active: col.active,
            })
          }

          return acc
        },
        { newColumnState: [], toggledColumns: [] },
      )

      setTableColumns(newColumnState)

      const result = await getTableState({
        collectionSlug,
        columns: toggledColumns,
        docs,
        enableRowSelections,
        renderRowTypes,
        signal: controller.signal,
        tableAppearance,
      })

      if (result) {
        setTableColumns(result.state)
        setTable(result.Table)
      }

      abortToggleColumnRef.current = null
    },
    [
      tableColumns,
      getTableState,
      setTable,
      collectionSlug,
      docs,
      enableRowSelections,
      renderRowTypes,
      tableAppearance,
    ],
  )

  const setActiveColumns = React.useCallback(
    async (activeColumnAccessors: string[], shouldSetModified?: boolean) => {
      if (shouldSetModified !== false) {
        setModified(true)
      }

      const activeColumns: Pick<Column, 'accessor' | 'active'>[] = tableColumns
        .map((col) => {
          return {
            accessor: col.accessor,
            active: activeColumnAccessors.includes(col.accessor),
          }
        })
        .sort((first, second) => {
          const indexOfFirst = activeColumnAccessors.indexOf(first.accessor)
          const indexOfSecond = activeColumnAccessors.indexOf(second.accessor)

          if (indexOfFirst === -1 || indexOfSecond === -1) {
            return 0
          }

          return indexOfFirst > indexOfSecond ? 1 : -1
        })

      const { state: columnState, Table } = await getTableState({
        collectionSlug,
        columns: activeColumns,
        docs,
        enableRowSelections,
        renderRowTypes,
        tableAppearance,
      })

      setTableColumns(columnState)
      setTable(Table)
    },
    [
      tableColumns,
      getTableState,
      setTable,
      collectionSlug,
      docs,
      enableRowSelections,
      renderRowTypes,
      tableAppearance,
    ],
  )

  const resetColumnsState = React.useCallback(async () => {
    await setActiveColumns(defaultColumns, false)
  }, [defaultColumns, setActiveColumns])

  // //////////////////////////////////////////////
  // Get preferences on collection change (drawers)
  // //////////////////////////////////////////////

  React.useEffect(() => {
    const sync = async () => {
      const defaultCollection = Array.isArray(collectionSlug) ? collectionSlug[0] : collectionSlug
      const collectionHasChanged = prevCollection.current !== defaultCollection

      if (collectionHasChanged || !listPreferences) {
        const currentPreferences = await getPreference<{
          columns: ListPreferences['columns']
        }>(preferenceKey)

        prevCollection.current = defaultCollection

        if (currentPreferences?.columns) {
          // setTableColumns()
          // buildColumnState({
          //   beforeRows,
          //   columnPreferences: currentPreferences?.columns,
          //   columns: initialColumns,
          //   enableRowSelections,
          //   fields,
          //   sortColumnProps,
          //   useAsTitle,
          // }),
        }
      }
    }

    void sync()
  }, [
    preferenceKey,
    getPreference,
    collectionSlug,
    fields,
    defaultColumns,
    useAsTitle,
    listPreferences,
    enableRowSelections,
    sortColumnProps,
  ])

  useEffect(() => {
    setTableColumns(columnState)
  }, [columnState])

  useEffect(() => {
    const abortTableState = abortTableStateRef.current

    return () => {
      abortAndIgnore(abortTableState)
    }
  }, [])

  return (
    <TableColumnContext.Provider
      value={{
        columns: tableColumns,
        LinkedCellOverride,
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
