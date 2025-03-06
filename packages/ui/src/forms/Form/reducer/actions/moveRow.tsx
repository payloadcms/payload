import type { FormState } from 'payload'

import type { MOVE_ROW } from '../types.js'

import { flattenRows } from '../helpers/flattenRows.js'
import { separateRows } from '../helpers/separateRows.js'

export const moveRow = (state: FormState, action: MOVE_ROW): FormState => {
  const { moveFromIndex, moveToIndex, path } = action

  // Handle moving rows on the top-level, i.e. `array.0.text` -> `array.1.text`
  const { remainingFields, rows: topLevelRows } = separateRows(path, state)
  const copyOfMovingRow = topLevelRows[moveFromIndex]
  topLevelRows.splice(moveFromIndex, 1)
  topLevelRows.splice(moveToIndex, 0, copyOfMovingRow)

  // modify array/block internal row state (i.e. collapsed, blockType)
  const rowsWithinField = [...(state[path]?.rows || [])]
  const copyOfMovingRow2 = { ...rowsWithinField[moveFromIndex] }
  rowsWithinField.splice(moveFromIndex, 1)
  rowsWithinField.splice(moveToIndex, 0, copyOfMovingRow2)

  const newState = {
    ...remainingFields,
    ...flattenRows(path, topLevelRows),
    [path]: {
      ...state[path],
      requiresRender: true,
      rows: rowsWithinField,
    },
  }

  // Do the same for custom components, i.e. `array.customComponents.RowLabels[0]` -> `array.customComponents.RowLabels[1]`
  // Do this _after_ initializing `newState` to avoid adding the `customComponents` key to the state if it doesn't exist
  if (newState[path]?.customComponents?.RowLabels) {
    const customComponents = {
      ...newState[path].customComponents,
      RowLabels: [...newState[path].customComponents.RowLabels],
    }

    // Ensure the array grows if necessary
    if (moveToIndex >= customComponents.RowLabels.length) {
      customComponents.RowLabels.length = moveToIndex + 1
    }

    const copyOfMovingLabel = customComponents.RowLabels[moveFromIndex]

    // eslint-disable-next-line  @typescript-eslint/no-floating-promises
    customComponents.RowLabels.splice(moveFromIndex, 1)

    // eslint-disable-next-line  @typescript-eslint/no-floating-promises
    customComponents.RowLabels.splice(moveToIndex, 0, copyOfMovingLabel)

    newState[path].customComponents = customComponents
  }

  return newState
}
