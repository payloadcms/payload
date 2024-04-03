'use client'
import type { SanitizedCollectionConfig } from 'payload/types'
import type { CellComponentProps } from 'payload/types'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react'

import type { ColumnPreferences } from '../../providers/ListInfo/index.js'
import type { Column } from '../Table/index.js'
import type { Action } from './columnReducer.js'

import { useComponentMap } from '../../providers/ComponentMap/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { usePreferences } from '../../providers/Preferences/index.js'
import { buildColumnState } from './buildColumnState.js'
import { columnReducer } from './columnReducer.js'
import { filterFields } from './filterFields.js'
import { getInitialColumns } from './getInitialColumns.js'

export interface ITableColumns {
  columns: Column[]
  dispatchTableColumns: React.Dispatch<Action>
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
  cellProps?: Partial<CellComponentProps>[]
  children: React.ReactNode
  collectionSlug: string
  enableRowSelections?: boolean
  listPreferences?: ListPreferences
  preferenceKey: string
}

export const TableColumnsProvider: React.FC<Props> = ({
  cellProps,
  children,
  collectionSlug,
  enableRowSelections = false,
  listPreferences,
  preferenceKey,
}) => {
  const config = useConfig()

  const { componentMap } = useComponentMap()

  const { fieldMap } = componentMap.collections[collectionSlug]

  const collectionConfig = config.collections.find(
    (collectionConfig) => collectionConfig.slug === collectionSlug,
  )

  const {
    admin: { defaultColumns, useAsTitle },
  } = collectionConfig

  const prevCollection = useRef<SanitizedCollectionConfig['slug']>(collectionSlug)
  const hasInitialized = useRef(false)
  const { getPreference, setPreference } = usePreferences()
  const [initialColumns] = useState<string[]>(() =>
    getInitialColumns(filterFields(fieldMap), useAsTitle, defaultColumns),
  )

  const [tableColumns, dispatchTableColumns] = useReducer(columnReducer, {}, () => {
    return buildColumnState({
      cellProps,
      columnPreferences: listPreferences?.columns,
      columns: initialColumns,
      enableRowSelections,
      fieldMap,
      useAsTitle,
    })
  })

  // /////////////////////////////////////
  // Get preferences on collection change
  // /////////////////////////////////////

  useEffect(() => {
    const sync = async () => {
      const collectionHasChanged = prevCollection.current !== collectionSlug

      if (collectionHasChanged || !listPreferences) {
        const currentPreferences = await getPreference<{
          columns: ColumnPreferences
        }>(preferenceKey)
        prevCollection.current = collectionSlug

        if (currentPreferences?.columns) {
          dispatchTableColumns({
            type: 'set',
            payload: {
              columns: buildColumnState({
                cellProps,
                columnPreferences: currentPreferences?.columns,
                columns: initialColumns,
                enableRowSelections: true,
                fieldMap,
                useAsTitle,
              }),
            },
          })
        }
      }
    }

    void sync()
  }, [
    preferenceKey,
    getPreference,
    collectionSlug,
    fieldMap,
    cellProps,
    defaultColumns,
    useAsTitle,
    listPreferences,
    initialColumns,
  ])

  // /////////////////////////////////////
  // Set preferences on column change
  // /////////////////////////////////////

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      return
    }

    const columns = tableColumns.map((c) => ({
      accessor: c?.accessor,
      active: c?.active,
    }))

    void setPreference(preferenceKey, { columns }, true)
  }, [tableColumns, preferenceKey, setPreference])

  const setActiveColumns = useCallback(
    (columns: string[]) => {
      // dispatchTableColumns({
      //   type: 'set',
      //   payload: {
      //     // onSelect,
      //     cellProps,
      //     collection: { ...collectionConfig, fields: formatFields(collectionConfig) },
      //     columns: columns.map((column) => ({
      //       accessor: column,
      //       active: true,
      //     })),
      //     i18n,
      //   },
      // })
    },
    [collectionConfig, cellProps],
  )

  const moveColumn = useCallback(
    (args: { fromIndex: number; toIndex: number }) => {
      const { fromIndex, toIndex } = args

      dispatchTableColumns({
        type: 'move',
        payload: {
          fromIndex,
          toIndex,
        },
      })
    },
    [dispatchTableColumns],
  )

  const toggleColumn = useCallback(
    (column: string) => {
      dispatchTableColumns({
        type: 'toggle',
        payload: {
          column,
        },
      })
    },
    [dispatchTableColumns],
  )

  return (
    <TableColumnContext.Provider
      value={{
        columns: tableColumns,
        dispatchTableColumns,
        moveColumn,
        setActiveColumns,
        toggleColumn,
      }}
    >
      {children}
    </TableColumnContext.Provider>
  )
}
