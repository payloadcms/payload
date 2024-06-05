import type { SanitizedCollectionConfig } from '../../../../collections/config/types'
import type { Props as CellProps } from '../../views/collections/List/Cell/types'
import type { Column } from '../Table/types'

import { fieldAffectsData } from '../../../../fields/config/types'
import buildColumns from './buildColumns'

type TOGGLE = {
  payload: {
    cellProps: Partial<CellProps>[]
    collection: SanitizedCollectionConfig
    column: string
  }
  type: 'toggle'
}

type SET = {
  payload: {
    cellProps: Partial<CellProps>[]
    collection: SanitizedCollectionConfig
    columns: Pick<Column, 'accessor' | 'active'>[]
  }
  type: 'set'
}

type MOVE = {
  payload: {
    cellProps: Partial<CellProps>[]
    collection: SanitizedCollectionConfig
    fromIndex: number
    toIndex: number
  }
  type: 'move'
}

export type Action = MOVE | SET | TOGGLE

const filterDisabledColumns = (
  columns: Pick<Column, 'accessor' | 'active'>[],
  collection: SanitizedCollectionConfig,
): Column[] => {
  return columns
    .map((col) => {
      const field = collection.fields.find((f) => fieldAffectsData(f) && f.name === col.accessor)
      if (field && !field.admin?.disableListColumn) {
        return {
          ...col,
          name: col.accessor,
          components: {
            Heading: null as React.ReactNode,
            renderCell: () => null,
          },
          label: 'label' in field ? field.label : col.accessor,
        } as Column
      }
      return null
    })
    .filter((col) => col !== null)
}

export const columnReducer = (state: Column[], action: Action): Column[] => {
  switch (action.type) {
    case 'toggle': {
      const { cellProps, collection, column } = action.payload

      const withToggledColumn = state.map((col) => {
        if (col.accessor === column) {
          return {
            ...col,
            active: !col.active,
          }
        }
        return col
      })

      const filteredColumns = filterDisabledColumns(withToggledColumn, collection)

      return buildColumns({
        cellProps,
        collection,
        columns: filteredColumns,
      })
    }
    case 'move': {
      const { cellProps, collection, fromIndex, toIndex } = action.payload

      const withMovedColumn = [...state]
      const [columnToMove] = withMovedColumn.splice(fromIndex, 1)
      withMovedColumn.splice(toIndex, 0, columnToMove)

      const filteredColumns = filterDisabledColumns(withMovedColumn, collection)

      return buildColumns({
        cellProps,
        collection,
        columns: filteredColumns,
      })
    }
    case 'set': {
      const { cellProps, collection, columns } = action.payload

      const filteredColumns = filterDisabledColumns(columns, collection)

      return buildColumns({
        cellProps,
        collection,
        columns: filteredColumns,
      })
    }
    default:
      return state
  }
}
