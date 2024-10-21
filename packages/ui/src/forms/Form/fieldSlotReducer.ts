import type { RenderedFieldMap } from 'payload'

type Action = {
  renderedFieldMap: RenderedFieldMap
  type: 'UPDATE_MANY'
}

export const fieldSlotReducer = (state: RenderedFieldMap, action: Action): RenderedFieldMap => {
  switch (action.type) {
    case 'UPDATE_MANY': {
      const newState = new Map(state)

      action.renderedFieldMap.entries().forEach(([fieldKey, field]) => {
        newState.set(fieldKey, field)
      })

      return newState
    }
    default:
      return state
  }
}
