import type { Where } from '../../../../types'
import type { Action } from './types'

const reducer = (state: Where[], action: Action): Where[] => {
  const newState = [...state]

  switch (action.type) {
    case 'add': {
      const { andIndex, field, orIndex, relation } = action

      if (relation === 'and') {
        newState[orIndex].and.splice(andIndex, 0, { [field]: {} })
        return newState
      }

      return [
        ...newState,
        {
          and: [
            {
              [field]: {},
            },
          ],
        },
      ]
    }

    case 'remove': {
      const { andIndex, orIndex } = action
      newState[orIndex].and.splice(andIndex, 1)

      if (newState[orIndex].and.length === 0) {
        newState.splice(orIndex, 1)
      }

      return newState
    }

    case 'update': {
      const { andIndex, orIndex } = action
      const { field, operator, value } = action

      if (typeof newState[orIndex].and[andIndex] === 'object') {
        newState[orIndex].and[andIndex] = {
          ...newState[orIndex].and[andIndex],
        }

        const [existingFieldName, existingCondition] = Object.entries(
          newState[orIndex].and[andIndex],
        )[0] || [undefined, undefined]

        if (operator) {
          newState[orIndex].and[andIndex] = {
            [existingFieldName]: {
              [operator]: Object.values(existingCondition)[0],
            },
          }
        }

        if (field) {
          newState[orIndex].and[andIndex] = {
            [field]: operator ? { [operator]: value } : {},
          }
        }

        if (value !== undefined) {
          newState[orIndex].and[andIndex] = {
            [existingFieldName]: Object.keys(existingCondition)[0]
              ? {
                  [Object.keys(existingCondition)[0]]: value,
                }
              : {},
          }
        }
      }

      return newState
    }

    case 'reset': {
      return []
    }

    default: {
      return newState
    }
  }
}

export default reducer
