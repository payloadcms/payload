import type { Column } from '../Table/types'

type TOGGLE = {
  payload: {
    column: string
  }
  type: 'toggle'
}

type SET = {
  payload: {
    columns: Column[]
  }
  type: 'set'
}

type MOVE = {
  payload: {
    fromIndex: number
    toIndex: number
  }
  type: 'move'
}

export type Action = MOVE | SET | TOGGLE

export const columnReducer = (state: Column[], action: Action): Column[] => {
  switch (action.type) {
    case 'toggle': {
      const { column } = action.payload

      const withToggledColumn = state.map((col) => {
        if (col?.name === column) {
          return {
            ...col,
            active: !col.active,
          }
        }

        return col
      })

      return withToggledColumn
    }
    case 'move': {
      const { fromIndex, toIndex } = action.payload
      const withMovedColumn = [...state]
      const [columnToMove] = withMovedColumn.splice(fromIndex, 1)
      withMovedColumn.splice(toIndex, 0, columnToMove)
      return withMovedColumn
    }
    case 'set': {
      const { columns } = action.payload
      return columns
    }
    default:
      return state
  }
}
