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
        const existingFieldName = Object.keys(newState[orIndex].and[andIndex])[0]
        const existingCondition = newState[orIndex].and[andIndex][existingFieldName]

        // Reset the condition if a new field is selected
        if (field && field !== existingFieldName) {
          newState[orIndex].and[andIndex] = {
            [field]: {}, // Reset operator and value when field changes
          }
        } else {
          // Update existing condition
          if (operator) {
            newState[orIndex].and[andIndex][existingFieldName] = {
              ...existingCondition,
              [operator]: value ?? Object.values(existingCondition)[0],
            }
          } else if (value !== undefined) {
            const existingOperator = Object.keys(existingCondition)[0]
            newState[orIndex].and[andIndex][existingFieldName] = {
              [existingOperator]: value,
            }
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
