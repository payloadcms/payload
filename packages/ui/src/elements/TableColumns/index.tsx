'use client'
import type { ClientCollectionConfig, ListPreferences, SanitizedCollectionConfig } from 'payload'

import React, { createContext, useCallback, useContext, useEffect } from 'react'

import type { SortColumnProps } from '../SortColumn/index.js'
import type { Column } from '../Table/index.js'

import { useConfig } from '../../providers/Config/index.js'
import { usePreferences } from '../../providers/Preferences/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { abortAndIgnore, handleAbortRef } from '../../utilities/abortAndIgnore.js'

export interface ITableColumns {
  columns: Column[]
  LinkedCellOverride?: React.ReactNode
  moveColumn: (args: { fromIndex: number; toIndex: number }) => Promise<void>
  resetColumnsState: () => Promise<void>
  setActiveColumns: (columns: string[]) => Promise<void>
  toggleColumn: (column: string) => Promise<void>
}

export const TableColumnContext = createContext<ITableColumns>({} as ITableColumns)

export const useTableColumns = (): ITableColumns => useContext(TableColumnContext)

type Props = {
  readonly children: React.ReactNode
  readonly collectionSlug: string
  readonly columnState: Column[]
  readonly docs: any[]
  readonly enableRowSelections?: boolean
  readonly LinkedCellOverride?: React.ReactNode
  readonly listPreferences?: ListPreferences
  readonly preferenceKey: string
  readonly renderRowTypes?: boolean
  readonly setTable: (Table: React.ReactNode) => void
  readonly sortColumnProps?: Partial<SortColumnProps>
  readonly tableAppearance?: 'condensed' | 'default'
}

// strip out Heading, Label, and renderedCells properties, they cannot be sent to the server
const sanitizeColumns = (columns: Column[]) => {
  return columns.map(({ accessor, active }) => ({
    accessor,
    active,
  }))
}

export const TableColumnsProvider: React.FC<Props> = ({
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

  const { admin: { defaultColumns, useAsTitle } = {}, fields } = getEntityConfig({
    collectionSlug,
  })

  const prevCollection = React.useRef<SanitizedCollectionConfig['slug']>(collectionSlug)
  const { getPreference } = usePreferences()

  const [tableColumns, setTableColumns] = React.useState(columnState)
  const abortTableStateRef = React.useRef<AbortController>(null)
  const abortToggleColumnRef = React.useRef<AbortController>(null)

  const moveColumn = useCallback(
    async (args: { fromIndex: number; toIndex: number }) => {
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
    async (activeColumnAccessors: string[]) => {
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
    await setActiveColumns(defaultColumns)
  }, [defaultColumns, setActiveColumns])

  // //////////////////////////////////////////////
  // Get preferences on collection change (drawers)
  // //////////////////////////////////////////////

  React.useEffect(() => {
    const sync = async () => {
      const collectionHasChanged = prevCollection.current !== collectionSlug

      if (collectionHasChanged || !listPreferences) {
        const currentPreferences = await getPreference<{
          columns: ListPreferences['columns']
        }>(preferenceKey)

        prevCollection.current = collectionSlug

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
        toggleColumn,
      }}
    >
      {children}
    </TableColumnContext.Provider>
  )
}
