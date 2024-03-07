import type { FormState } from 'payload/types'

import { arraysHaveSameStrings } from '../../utilities/arraysHaveSameStrings.js'

const propsToCheck = ['passesCondition', 'valid', 'errorMessage']

export const mergeServerFormState = (
  oldState: FormState,
  newState: FormState,
): { changed: boolean; newState: FormState } => {
  let changed = false

  Object.entries(newState).forEach(([path, newFieldState]) => {
    newFieldState.initialValue = oldState[path]?.initialValue
    newFieldState.value = oldState[path].value

    const oldErrorPaths: string[] = []
    const newErrorPaths: string[] = []

    if (oldState[path].errorPaths instanceof Set) {
      oldState[path].errorPaths.forEach((path) => oldErrorPaths.push(path))
    }

    if (
      newFieldState.errorPaths &&
      !Array.isArray(newFieldState.errorPaths) &&
      typeof newFieldState.errorPaths
    ) {
      Object.values(newFieldState.errorPaths).forEach((path) => newErrorPaths.push(path))
    }

    if (!arraysHaveSameStrings(oldErrorPaths, newErrorPaths)) {
      changed = true
    }

    propsToCheck.forEach((prop) => {
      if (newFieldState[prop] != oldState[path][prop]) {
        changed = true
      }
    })
  })

  return { changed, newState }
}
