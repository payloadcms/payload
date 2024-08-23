'use client'
import type { CellComponentProps, ClientField, SanitizedCollectionConfig } from 'payload'

import React, { createContext, useCallback, useContext, useState } from 'react'

import type { ColumnPreferences } from '../../providers/ListInfo/index.js'
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
}

export const TableColumnsProvider: React.FC<Props> = ({
  beforeRows,
  cellProps,
  children,
  collectionSlug,
  enableRowSelections = false,
  listPreferences,
  preferenceKey,
}) => {
  const {
    config: { collections },
  } = useConfig()

  const collectionConfig = collections.find((c) => c.slug === collectionSlug)

  const {
    admin: { defaultColumns, useAsTitle },
    fields,
  } = collectionConfig

  const prevCollection = React.useRef<SanitizedCollectionConfig['slug']>(collectionSlug)
  const { getPreference, setPreference } = usePreferences()

  const [initialColumns] = useState<ColumnPreferences>(() =>
    getInitialColumns(filterFields(fields), useAsTitle, defaultColumns),
  )

  const [tableColumns, setTableColumns] = React.useState(() =>
    buildColumnState({
      beforeRows,
      columnPreferences: listPreferences?.columns,
      columns: initialColumns,
      enableRowSelections,
      fields,
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

  const reassignLinkColumn = useCallback((columns: Column[]): Column[] => {
    let foundFirstActive = false
    let linkColumn = false

    const newColumns = columns.map((col) => {
      if (col.active) {
        linkColumn = !foundFirstActive && col.accessor !== '_select'
      }

      if (linkColumn) foundFirstActive = true

      return {
        ...col,
        cellProps: {
          link: linkColumn,
          ...col.cellProps,
        },
      }
    })

    return newColumns
  }, [])

  const moveColumn = useCallback(
    (args: { fromIndex: number; toIndex: number }) => {
      const { fromIndex, toIndex } = args

      const withMovedColumn = [...tableColumns]
      const [columnToMove] = withMovedColumn.splice(fromIndex, 1)
      withMovedColumn.splice(toIndex, 0, columnToMove)

      const newColumns = reassignLinkColumn(withMovedColumn)
      setTableColumns(newColumns)
      updateColumnPreferences(newColumns)
    },
    [tableColumns, updateColumnPreferences, reassignLinkColumn],
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

      const newColumns = reassignLinkColumn(toggledColumns)
      setTableColumns(newColumns)
      updateColumnPreferences(newColumns)
    },
    [tableColumns, updateColumnPreferences, reassignLinkColumn],
  )

  const setActiveColumns = React.useCallback(
    (activeColumnAccessors) => {
      const activeColumns = tableColumns.map((col) => {
        return {
          ...col,
          active: activeColumnAccessors.includes(col.accessor),
        }
      })

      const newColumns = reassignLinkColumn(activeColumns)
      updateColumnPreferences(newColumns)
    },
    [tableColumns, updateColumnPreferences, reassignLinkColumn],
  )

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
  ])

  return (
    <TableColumnContext.Provider
      value={{
        cellProps,
        columns: tableColumns,
        moveColumn,
        setActiveColumns,
        toggleColumn,
      }}
    >
      {children}
    </TableColumnContext.Provider>
  )
}
