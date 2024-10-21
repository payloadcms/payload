import type { RenderedFieldMap } from 'payload'

type Action = {
  renderedFieldMap: RenderedFieldMap
  type: 'SET_FIELD_SLOTS'
}

export const fieldSlotReducer = (state: RenderedFieldMap, action: Action): RenderedFieldMap => {
  switch (action.type) {
    case 'SET_FIELD_SLOTS': {
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
