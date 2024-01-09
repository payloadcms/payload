import { I18n } from '@payloadcms/translations'
import type { SanitizedCollectionConfig } from '../../../../collections/config/types'
import type { Props as CellProps } from '../../views/collections/List/Cell/types'
import type { Column } from '../Table/types'

import buildColumns from './buildColumns'

type TOGGLE = {
  payload: {
    cellProps: Partial<CellProps>[]
    collection: SanitizedCollectionConfig
    column: string
    i18n: I18n
  }
  type: 'toggle'
}

type SET = {
  payload: {
    cellProps: Partial<CellProps>[]
    collection: SanitizedCollectionConfig
    columns: Pick<Column, 'accessor' | 'active'>[]
    i18n: I18n
  }
  type: 'set'
}

type MOVE = {
  payload: {
    cellProps: Partial<CellProps>[]
    collection: SanitizedCollectionConfig
    fromIndex: number
    toIndex: number
    i18n: I18n
  }
  type: 'move'
}

export type Action = MOVE | SET | TOGGLE

export const columnReducer = (state: Column[], action: Action): Column[] => {
  switch (action.type) {
    case 'toggle': {
      const { cellProps, collection, column, i18n } = action.payload

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
        i18n,
        columns: withToggledColumn,
      })
    }
    case 'move': {
      const { cellProps, collection, fromIndex, toIndex, i18n } = action.payload

      const withMovedColumn = [...state]
      const [columnToMove] = withMovedColumn.splice(fromIndex, 1)
      withMovedColumn.splice(toIndex, 0, columnToMove)

      return buildColumns({
        cellProps,
        collection,
        i18n,
        columns: withMovedColumn,
      })
    }
    case 'set': {
      const { cellProps, collection, columns, i18n } = action.payload

      return buildColumns({
        cellProps,
        collection,
        i18n,
        columns,
      })
    }
    default:
      return state
  }
}
