import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react'

import type { SanitizedCollectionConfig } from '../../../../collections/config/types'
import type { Props as CellProps } from '../../views/collections/List/Cell/types'
import type { ListPreferences } from '../../views/collections/List/types'
import type { Column } from '../Table/types'
import type { Action } from './columnReducer'

import { type Field, fieldHasSubFields } from '../../../../fields/config/types'
import { usePreferences } from '../../utilities/Preferences'
import formatFields from '../../views/collections/List/formatFields'
import buildColumns from './buildColumns'
import { columnReducer } from './columnReducer'
import getInitialColumnState from './getInitialColumns'

export interface ITableColumns {
  columns: Column[]
  dispatchTableColumns: React.Dispatch<Action>
  moveColumn: (args: { fromIndex: number; toIndex: number }) => void
  setActiveColumns: (columns: string[]) => void
  toggleColumn: (column: string) => void
}

export const TableColumnContext = createContext<ITableColumns>({} as ITableColumns)

export const useTableColumns = (): ITableColumns => useContext(TableColumnContext)

const filterTableFields = (fields: Field[]): Field[] => {
  return fields.reduce((acc, field) => {
    if (fieldHasSubFields(field)) {
      field = {
        ...field,
        fields: filterTableFields(field.fields),
      }
    }
    if (!field.admin?.disableListColumn) acc.push(field)
    return acc
  }, [])
}

export const TableColumnsProvider: React.FC<{
  cellProps?: Partial<CellProps>[]
  children: React.ReactNode
  collection: SanitizedCollectionConfig
}> = ({
  cellProps,
  children,
  collection: {
    admin: { defaultColumns, useAsTitle },
  },
  collection,
}) => {
  const preferenceKey = `${collection.slug}-list`
  const prevCollection = useRef<SanitizedCollectionConfig['slug']>()
  const hasInitialized = useRef(false)
  const { getPreference, setPreference } = usePreferences()
  const [formattedFields] = useState<Field[]>(() => formatFields(collection))
  const filteredFields = filterTableFields(formattedFields)

  const [tableColumns, dispatchTableColumns] = useReducer(columnReducer, {}, () => {
    const initialColumns = getInitialColumnState(filteredFields, useAsTitle, defaultColumns)

    return buildColumns({
      cellProps,
      collection,
      columns: initialColumns.map((column) => ({
        accessor: column,
        active: true,
      })),
    })
  })

  // /////////////////////////////////////
  // Sync preferences on collection change
  // /////////////////////////////////////

  useEffect(() => {
    const sync = async () => {
      const collectionHasChanged = prevCollection.current !== collection.slug

      if (collectionHasChanged) {
        hasInitialized.current = false

        const currentPreferences = await getPreference<ListPreferences>(preferenceKey)
        prevCollection.current = collection.slug
        const initialColumns = getInitialColumnState(filteredFields, useAsTitle, defaultColumns)
        const newCols = currentPreferences?.columns || initialColumns

        dispatchTableColumns({
          type: 'set',
          payload: {
            cellProps,
            collection: { ...collection, fields: filteredFields },
            columns: newCols.map((column) => {
              // 'string' is for backwards compatibility
              // the preference used to be stored as an array of strings
              if (typeof column === 'string') {
                return {
                  accessor: column,
                  active: true,
                }
              }
              return column
            }),
          },
        })

        hasInitialized.current = true
      }
    }

    void sync()
  }, [
    preferenceKey,
    setPreference,
    tableColumns,
    getPreference,
    useAsTitle,
    defaultColumns,
    collection,
    cellProps,
    filteredFields,
  ])

  // /////////////////////////////////////
  // Set preferences on column change
  // /////////////////////////////////////

  useEffect(() => {
    if (!hasInitialized.current) return
    const columns = tableColumns.map((c) => ({
      accessor: c.accessor,
      active: c.active,
    }))

    void setPreference(preferenceKey, { columns }, true)
  }, [tableColumns, preferenceKey, setPreference, getPreference])

  const setActiveColumns = useCallback(
    (columns: string[]) => {
      dispatchTableColumns({
        type: 'set',
        payload: {
          // onSelect,
          cellProps,
          collection: { ...collection, fields: formatFields(collection) },
          columns: columns.map((column) => ({
            accessor: column,
            active: true,
          })),
        },
      })
    },
    [collection, cellProps],
  )

  const moveColumn = useCallback(
    (args: { fromIndex: number; toIndex: number }) => {
      const { fromIndex, toIndex } = args

      dispatchTableColumns({
        type: 'move',
        payload: {
          cellProps,
          collection: { ...collection, fields: formatFields(collection) },
          fromIndex,
          toIndex,
        },
      })
    },
    [collection, cellProps],
  )

  const toggleColumn = useCallback(
    (column: string) => {
      dispatchTableColumns({
        type: 'toggle',
        payload: {
          cellProps,
          collection: { ...collection, fields: formatFields(collection) },
          column,
        },
      })
    },
    [collection, cellProps],
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
