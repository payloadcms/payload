import type { Column } from '../Table/types.js'

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
  let newState = [...state]

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

      newState = withToggledColumn
      break
    }
    case 'move': {
      const { fromIndex, toIndex } = action.payload
      const withMovedColumn = [...state]
      const [columnToMove] = withMovedColumn.splice(fromIndex, 1)
      withMovedColumn.splice(toIndex, 0, columnToMove)
      newState = withMovedColumn
      break
    }
    case 'set': {
      const { columns } = action.payload
      newState = columns
      break
    }
    default:
      break
  }

  // determine new `link` prop on only a single cell
  // it needs to be the first active column, and nothing else

  const withActive = newState.map((column, index) => {
    if (column.active) {
      return {
        ...column,
        cellProps: {
          ...column.cellProps,
          link: index === 0,
        },
      }
    }

    return column
  }, [])

  return withActive
}
