'use client'
import type { CellComponentProps, SanitizedCollectionConfig } from 'payload'

import React, { createContext, useCallback, useContext, useState } from 'react'

import type { ColumnPreferences } from '../../providers/ListInfo/index.js'
import type { Column } from '../Table/index.js'

import { useConfig } from '../../providers/Config/index.js'
import { usePreferences } from '../../providers/Preferences/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { buildColumnState } from './buildColumnState.js'
import { filterFields } from './filterFields.js'
import { getInitialColumns } from './getInitialColumns.js'

export interface ITableColumns {
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
  readonly cellProps?: Partial<CellComponentProps>[]
  readonly children: React.ReactNode
  readonly collectionSlug: string
  readonly enableRowSelections?: boolean
  readonly listPreferences?: ListPreferences
  readonly preferenceKey: string
}

export const TableColumnsProvider: React.FC<Props> = ({
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
  const { i18n } = useTranslation()

  const collectionConfig = collections.find(
    (collectionConfig) => collectionConfig.slug === collectionSlug,
  )

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
      cellProps,
      columnPreferences: listPreferences?.columns,
      columns: initialColumns,
      enableRowSelections,
      fields,
      i18n,
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
    (activeColumnAccessors) => {
      const activeColumns = tableColumns.map((col) => {
        return {
          ...col,
          active: activeColumnAccessors.includes(col.accessor),
        }
      })

      updateColumnPreferences(activeColumns)
    },
    [tableColumns, updateColumnPreferences],
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
              cellProps,
              columnPreferences: currentPreferences?.columns,
              columns: initialColumns,
              enableRowSelections: true,
              fields,
              i18n,
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
    cellProps,
    defaultColumns,
    i18n,
    useAsTitle,
    listPreferences,
    initialColumns,
  ])

  return (
    <TableColumnContext.Provider
      value={{
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
