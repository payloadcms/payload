import type { RenderedFieldMap } from 'payload'

type Action = {
  indexPath: string
  renderedFieldMap: RenderedFieldMap
  type: 'SET_FIELD_SLOT'
}

export const fieldSlotReducer = (state: RenderedFieldMap, action: Action): RenderedFieldMap => {
  switch (action.type) {
    case 'SET_FIELD_SLOT': {
      const newState = new Map(state)

      action.renderedFieldMap.entries().forEach(([indexPath, field]) => {
        // newState.set(indexPath, field)
      })

      return newState
    }
    default:
      return state
  }
}
