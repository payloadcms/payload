'use client'
import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react'

import type { SanitizedCollectionConfig, Field } from 'payload/types'
import type { CellProps } from 'payload/types'
import type { ListPreferences } from '../../views/List/types'
import type { Column } from '../Table/types'
import type { Action } from './columnReducer'

import { usePreferences } from '../../providers/Preferences'
import { useTranslation } from '../../providers/Translation'
import { columnReducer } from './columnReducer'
import { useConfig } from '../../providers/Config'
import { useComponentMap } from '../../providers/ComponentMapProvider'

export interface ITableColumns {
  columns: Column[]
  dispatchTableColumns: React.Dispatch<Action>
  moveColumn: (args: { fromIndex: number; toIndex: number }) => void
  setActiveColumns: (columns: string[]) => void
  toggleColumn: (column: string) => void
}

export const TableColumnContext = createContext<ITableColumns>({} as ITableColumns)

export const useTableColumns = (): ITableColumns => useContext(TableColumnContext)

export const TableColumnsProvider: React.FC<{
  cellProps?: Partial<CellProps>[]
  children: React.ReactNode
  collectionSlug: string
}> = ({ cellProps, children, collectionSlug }) => {
  const config = useConfig()

  const { componentMap, getMappedFieldByPath } = useComponentMap()

  const { initialColumns } = componentMap.collections[collectionSlug]

  const collectionConfig = config.collections.find(
    (collectionConfig) => collectionConfig.slug === collectionSlug,
  )

  const {
    admin: { useAsTitle, defaultColumns },
  } = collectionConfig

  const preferenceKey = `${collectionSlug}-list`
  const prevCollection = useRef<SanitizedCollectionConfig['slug']>()
  const hasInitialized = useRef(false)
  const { getPreference, setPreference } = usePreferences()
  const { i18n } = useTranslation()

  const [tableColumns, dispatchTableColumns] = useReducer(columnReducer, {}, () => {
    return initialColumns.map((columnPath, index) => {
      const field = getMappedFieldByPath({ path: columnPath, collectionSlug })

      if (field) {
        const column: Column = {
          accessor: columnPath,
          active: true,
          label: field.label,
          name: field.name,
          components: {
            Cell: field.Cell,
            Heading: field.Heading,
          },
          cellProps: cellProps?.[index],
        }

        return column
      }
    })
  })

  // // /////////////////////////////////////
  // // Sync preferences on collectionConfig change
  // // /////////////////////////////////////

  // useEffect(() => {
  //   const sync = async () => {
  //     const collectionHasChanged = prevCollection.current !== collectionConfig.slug

  //     if (collectionHasChanged) {
  //       hasInitialized.current = false

  //       const currentPreferences = await getPreference<ListPreferences>(preferenceKey)
  //       prevCollection.current = collectionConfig.slug
  //       const initialColumns = getInitialColumnState(columns, useAsTitle, defaultColumns)
  //       const newCols = currentPreferences?.columns || initialColumns

  //       dispatchTableColumns({
  //         payload: {
  //           cellProps,
  //           i18n,
  //           collection: { ...collectionConfig, fields: formatFields(collectionConfig) },
  //           columns: newCols.map((column) => {
  //             // 'string' is for backwards compatibility
  //             // the preference used to be stored as an array of strings
  //             if (typeof column === 'string') {
  //               return {
  //                 accessor: column,
  //                 active: true,
  //               }
  //             }
  //             return column
  //           }),
  //         },
  //         type: 'set',
  //       })

  //       hasInitialized.current = true
  //     }
  //   }

  //   sync()
  // }, [
  //   preferenceKey,
  //   setPreference,
  //   tableColumns,
  //   getPreference,
  //   useAsTitle,
  //   defaultColumns,
  //   collectionConfig,
  //   cellProps,
  //   columns,
  // ])

  // // /////////////////////////////////////
  // // Set preferences on column change
  // // /////////////////////////////////////

  // useEffect(() => {
  //   if (!hasInitialized.current) return
  //   const columns = tableColumns.map((c) => ({
  //     accessor: c.accessor,
  //     active: c.active,
  //   }))

  //   void setPreference(preferenceKey, { columns }, true)
  // }, [tableColumns, preferenceKey, setPreference, getPreference])

  // const setActiveColumns = useCallback(
  //   (columns: string[]) => {
  //     dispatchTableColumns({
  //       payload: {
  //         // onSelect,
  //         i18n,
  //         cellProps,
  //         collection: { ...collectionConfig, fields: formatFields(collectionConfig) },
  //         columns: columns.map((column) => ({
  //           accessor: column,
  //           active: true,
  //         })),
  //       },
  //       type: 'set',
  //     })
  //   },
  //   [collectionConfig, cellProps],
  // )

  const moveColumn = useCallback(
    (args: { fromIndex: number; toIndex: number }) => {
      const { fromIndex, toIndex } = args

      dispatchTableColumns({
        payload: {
          fromIndex,
          toIndex,
        },
        type: 'move',
      })
    },
    [dispatchTableColumns],
  )

  const toggleColumn = useCallback(
    (column: string) => {
      dispatchTableColumns({
        payload: {
          column,
        },
        type: 'toggle',
      })
    },
    [collectionConfig, cellProps],
  )

  return (
    <TableColumnContext.Provider
      value={{
        columns: tableColumns,
        dispatchTableColumns,
        moveColumn,
        // setActiveColumns,
        toggleColumn,
      }}
    >
      {children}
    </TableColumnContext.Provider>
  )
}
