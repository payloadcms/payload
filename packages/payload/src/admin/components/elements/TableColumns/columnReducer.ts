import type { SanitizedCollectionConfig } from '../../../../collections/config/types'
import type { Props as CellProps } from '../../views/collections/List/Cell/types'
import type { Column } from '../Table/types'

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

export const columnReducer = (state: Column[], action: Action): Column[] => {
  switch (action.type) {
    case 'toggle': {
      const { cellProps, collection, column } = action.payload

      const withToggledColumn = state.map((col) => {
        if (col.name === column) {
          return {
            ...col,
            active: !col.active,
          }
        }

        return col
      })

      return buildColumns({
        cellProps,
        collection,
        columns: withToggledColumn,
      })
    }
    case 'move': {
      const { cellProps, collection, fromIndex, toIndex } = action.payload

      const withMovedColumn = [...state]
      const [columnToMove] = withMovedColumn.splice(fromIndex, 1)
      withMovedColumn.splice(toIndex, 0, columnToMove)

      return buildColumns({
        cellProps,
        collection,
        columns: withMovedColumn,
      })
    }
    case 'set': {
      const { cellProps, collection, columns } = action.payload

      return buildColumns({
        cellProps,
        collection,
        columns,
      })
    }
    default:
      return state
  }
}
