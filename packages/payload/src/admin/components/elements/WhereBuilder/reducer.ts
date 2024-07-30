import type { Where } from '../../../../types'
import type { Action } from './types'

const reducer = (state: Where[], action: Action): Where[] => {
  const newState = [...state]

  const { andIndex, orIndex } = action

  switch (action.type) {
    case 'add': {
      const { field, relation } = action

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
      newState[orIndex].and.splice(andIndex, 1)

      if (newState[orIndex].and.length === 0) {
        newState.splice(orIndex, 1)
      }

      return newState
    }

    case 'update': {
      const { field, operator, value } = action

      if (typeof newState[orIndex].and[andIndex] === 'object') {
        newState[orIndex].and[andIndex] = {
          ...newState[orIndex].and[andIndex],
        }

        const [existingFieldName, existingCondition] = Object.entries(
          newState[orIndex].and[andIndex],
        )[0] || [undefined, undefined]

        if (operator) {
          const existingOperator = Object.keys(existingCondition)[0]

          const newValue =
            existingOperator && existingOperator !== operator
              ? undefined
              : Object.values(existingCondition)[0]
          newState[orIndex].and[andIndex] = {
            [existingFieldName]: {
              [operator]: newValue,
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

    default: {
      return newState
    }
  }
}

export default reducer
