'use client'
import type {
  ClientCollectionConfig,
  Column,
  ColumnPreferences,
  SanitizedCollectionConfig,
} from 'payload'

import React, { createContext, useCallback, useContext } from 'react'

import type {
  GetTableStateClient,
  GetTableStateClientArgs,
} from '../../providers/ServerFunctions/types.js'
import type { SortColumnProps } from '../SortColumn/index.js'

import { useConfig } from '../../providers/Config/index.js'
import { usePreferences } from '../../providers/Preferences/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { abortAndIgnore } from '../../utilities/abortAndIgnore.js'

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

export type ListPreferences = {
  columns: ColumnPreferences
}

export type TableColumnsProviderProps = {
  readonly children: React.ReactNode
  readonly collectionSlug: string
  readonly columnState: Column[]
  readonly docs: any[]
  readonly enableRowSelections?: boolean
  readonly getTableState?: GetTableStateClient
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

export const TableColumnsProvider: React.FC<TableColumnsProviderProps> = ({
  children,
  collectionSlug,
  columnState,
  docs,
  enableRowSelections,
  getTableState: getTableStateFromProps,
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
  }) as ClientCollectionConfig

  const prevCollection = React.useRef<SanitizedCollectionConfig['slug']>(collectionSlug)
  const { getPreference, setPreference } = usePreferences()

  const [tableColumns, setTableColumns] = React.useState(columnState)
  const tableStateControllerRef = React.useRef<AbortController>(null)

  const rebuildTableAndState = useCallback(
    async (updatedColumnState) => {
      const controller = new AbortController()
      tableStateControllerRef.current = controller
      const args: GetTableStateClientArgs = {
        collectionSlug,
        columns: sanitizeColumns(updatedColumnState),
        docs,
        enableRowSelections,
        renderRowTypes,
        signal: controller.signal,
        tableAppearance,
      }
      let result
      if (typeof getTableStateFromProps === 'function') {
        result = await getTableStateFromProps(args)
      } else {
        result = await getTableState(args)
      }

      if (result) {
        setTableColumns(result.state)
        setTable(result.Table)
      }
    },
    [
      collectionSlug,
      docs,
      enableRowSelections,
      getTableStateFromProps,
      renderRowTypes,
      tableAppearance,
      setTable,
      getTableState,
    ],
  )

  const moveColumn = useCallback(
    async (args: { fromIndex: number; toIndex: number }) => {
      abortAndIgnore(tableStateControllerRef.current)

      const { fromIndex, toIndex } = args
      const withMovedColumn = [...tableColumns]
      const [columnToMove] = withMovedColumn.splice(fromIndex, 1)
      withMovedColumn.splice(toIndex, 0, columnToMove)

      setTableColumns(withMovedColumn)
      await rebuildTableAndState(withMovedColumn)
    },
    [rebuildTableAndState, tableColumns],
  )

  const toggleColumn = useCallback(
    async (column: string) => {
      abortAndIgnore(tableStateControllerRef.current)

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
      await rebuildTableAndState(newColumnState)
    },
    [rebuildTableAndState, tableColumns],
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
        .toSorted((first, second) => {
          const indexOfFirst = activeColumnAccessors.indexOf(first.accessor)
          const indexOfSecond = activeColumnAccessors.indexOf(second.accessor)

          if (indexOfFirst === -1 || indexOfSecond === -1) {
            return 0
          }

          return indexOfFirst > indexOfSecond ? 1 : -1
        })

      await rebuildTableAndState(activeColumns)
    },
    [rebuildTableAndState, tableColumns],
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
          columns: ColumnPreferences
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

  React.useEffect(() => {
    return () => {
      abortAndIgnore(tableStateControllerRef.current)
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
