'use client'
import type { CellComponentProps, ClientCollectionConfig, SanitizedCollectionConfig } from 'payload'

import React, { createContext, useCallback, useContext, useState } from 'react'

import type { ColumnPreferences } from '../../providers/ListInfo/index.js'
import type { SortColumnProps } from '../SortColumn/index.js'
import type { Column } from '../Table/index.js'

import { useConfig } from '../../providers/Config/index.js'
import { usePreferences } from '../../providers/Preferences/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
// import { buildColumnState } from './buildColumnState.js'
import { filterFields } from './filterFields.js'
import { getInitialColumns } from './getInitialColumns.js'

export interface ITableColumns {
  cellProps?: Partial<CellComponentProps>[]
  columns: Column[]
  moveColumn: (args: { fromIndex: number; toIndex: number }) => void
  resetColumnsState: () => void
  setActiveColumns: (columns: string[]) => void
  toggleColumn: (column: string) => void
}

export const TableColumnContext = createContext<ITableColumns>({} as ITableColumns)

export const useTableColumns = (): ITableColumns => useContext(TableColumnContext)

export type ListPreferences = {
  columns: ColumnPreferences
}

type Props = {
  readonly beforeRows?: Column[]
  readonly cellProps?: Partial<CellComponentProps>[]
  readonly children: React.ReactNode
  readonly collectionSlug: string
  readonly columnState: Column[]
  readonly docs: any[]
  readonly enableRowSelections?: boolean
  readonly listPreferences?: ListPreferences
  readonly preferenceKey: string
  readonly setTable: (Table: React.ReactNode) => void
  readonly sortColumnProps?: Partial<SortColumnProps>
}

// strip out Heading, Label, and renderedCells properties, they cannot be sent to the server
const sanitizeColumns = (columns: Column[]) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return columns.map(({ Heading, Label, renderedCells, ...rest }) => rest)
}

export const TableColumnsProvider: React.FC<Props> = ({
  beforeRows,
  cellProps,
  children,
  collectionSlug,
  columnState,
  docs,
  enableRowSelections = false,
  listPreferences,
  preferenceKey,
  setTable,
  sortColumnProps,
}) => {
  const { getEntityConfig } = useConfig()

  const { getTableState } = useServerFunctions()

  const { admin: { defaultColumns, useAsTitle } = {}, fields } = getEntityConfig({
    collectionSlug,
  }) as ClientCollectionConfig

  const prevCollection = React.useRef<SanitizedCollectionConfig['slug']>(collectionSlug)
  const { getPreference, setPreference } = usePreferences()

  const [initialColumns, setInitialColumns] = useState<ColumnPreferences>(() =>
    fields ? getInitialColumns(filterFields(fields), useAsTitle, defaultColumns) : [],
  )

  // useEffect(() => {
  //   if (fields) {
  //     setInitialColumns(getInitialColumns(filterFields(fields), useAsTitle, defaultColumns))
  //   }
  // }, [defaultColumns, fields, useAsTitle])

  const [tableColumns, setTableColumns] = React.useState(columnState)

  const updateColumnPreferences = React.useCallback(
    (newColumns: Column[]) => {
      const columns = newColumns.map((c) => ({
        accessor: c?.accessor,
        active: c?.active,
      }))

      void setPreference(preferenceKey, { columns }, true)
    },
    [preferenceKey, setPreference],
  )

  const moveColumn = useCallback(
    (args: { fromIndex: number; toIndex: number }) => {
      const { fromIndex, toIndex } = args
      const withMovedColumn = [...tableColumns]
      const [columnToMove] = withMovedColumn.splice(fromIndex, 1)
      withMovedColumn.splice(toIndex, 0, columnToMove)
      setTableColumns(withMovedColumn)
      updateColumnPreferences(withMovedColumn)

      // TODO: instead of all this logic,
      // just fire a server action to get new state and render new table
      // This server action can handle all of the preferences changes, too
      // const { Table, columnState } = renderTable({
      //
      // })
      // setTableColumns(columnState)
      // setTable(Table)
    },
    [tableColumns, updateColumnPreferences],
  )

  const toggleColumn = useCallback(
    async (column: string) => {
      const toggledColumns = tableColumns.reduce((acc, col) => {
        if (col.active || col.accessor === column) {
          acc.push({
            ...col,
            active: col.accessor === column ? !col.active : col.active,
          })
        }

        return acc
      }, [] as Column[])

      const { state: columnState, Table } = await getTableState({
        collectionSlug,
        columns: sanitizeColumns(toggledColumns),
        docs,
      })

      // updateColumnPreferences(toggledColumns)

      setTableColumns(columnState)
      setTable(Table)
    },
    [tableColumns, getTableState, setTable, collectionSlug, docs],
  )

  const setActiveColumns = React.useCallback(
    (activeColumnAccessors: string[]) => {
      const activeColumns = tableColumns
        .map((col) => {
          return {
            ...col,
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

      setTableColumns(activeColumns)
      updateColumnPreferences(activeColumns)
    },
    [tableColumns, updateColumnPreferences],
  )

  const resetColumnsState = React.useCallback(() => {
    setActiveColumns(defaultColumns)
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
    initialColumns,
    beforeRows,
    enableRowSelections,
    sortColumnProps,
  ])

  return (
    <TableColumnContext.Provider
      value={{
        cellProps,
        columns: tableColumns,
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
