'use client'
import type { CellComponentProps, ClientCollectionConfig, SanitizedCollectionConfig } from 'payload'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import type { ColumnPreferences } from '../../providers/ListInfo/index.js'
import type { SortColumnProps } from '../SortColumn/index.js'
import type { Column } from '../Table/index.js'

import { useConfig } from '../../providers/Config/index.js'
import { usePreferences } from '../../providers/Preferences/index.js'
import { buildColumnState } from './buildColumnState.js'
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
  readonly enableRowSelections?: boolean
  readonly listPreferences?: ListPreferences
  readonly preferenceKey: string
  readonly sortColumnProps?: Partial<SortColumnProps>
}

export const TableColumnsProvider: React.FC<Props> = ({
  beforeRows,
  cellProps,
  children,
  collectionSlug,
  enableRowSelections = false,
  listPreferences,
  preferenceKey,
  sortColumnProps,
}) => {
  const { getEntityConfig } = useConfig()

  const { admin: { defaultColumns, useAsTitle } = {}, fields } = getEntityConfig({
    collectionSlug,
  }) as ClientCollectionConfig

  const prevCollection = React.useRef<SanitizedCollectionConfig['slug']>(collectionSlug)
  const { getPreference, setPreference } = usePreferences()

  const [initialColumns, setInitialColumns] = useState<ColumnPreferences>(() => {
    if (fields) {
      return getInitialColumns(filterFields(fields), useAsTitle, defaultColumns)
    }
  })

  useEffect(() => {
    if (fields) {
      setInitialColumns(getInitialColumns(filterFields(fields), useAsTitle, defaultColumns))
    }
  }, [defaultColumns, fields, useAsTitle])

  const [tableColumns, setTableColumns] = React.useState(() =>
    buildColumnState({
      beforeRows,
      columnPreferences: listPreferences?.columns,
      columns: initialColumns,
      enableRowSelections,
      fields,
      sortColumnProps,
      useAsTitle,
    }),
  )

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
    },
    [tableColumns, updateColumnPreferences],
  )

  const toggleColumn = useCallback(
    (column: string) => {
      const toggledColumns = tableColumns.map((col) => {
        return {
          ...col,
          active:
            col?.cellProps?.field &&
            'name' in col.cellProps.field &&
            col?.cellProps?.field?.name === column
              ? !col.active
              : col.active,
        }
      })

      setTableColumns(toggledColumns)
      updateColumnPreferences(toggledColumns)
    },
    [tableColumns, updateColumnPreferences],
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
          setTableColumns(
            buildColumnState({
              beforeRows,
              columnPreferences: currentPreferences?.columns,
              columns: initialColumns,
              enableRowSelections,
              fields,
              sortColumnProps,
              useAsTitle,
            }),
          )
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
