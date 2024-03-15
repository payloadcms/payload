import type { FormState } from 'payload/types'

import { arraysHaveSameStrings } from '../../utilities/arraysHaveSameStrings.js'

const propsToCheck = ['passesCondition', 'valid', 'errorMessage']

/**
 * Merges certain properties from the server state into the client state. These do not include values,
 * as we do not want to update them on the client like that, which would cause flickering.
 *
 * We want to use this to update the error state, and other properties that are not user input, as the error state
 * is the thing we want to keep in sync with the server (where it's calculated) on the client.
 */
export const mergeServerFormState = (
  oldState: FormState,
  newState: FormState,
): { changed: boolean; newState: FormState } => {
  let changed = false

  Object.entries(newState).forEach(([path, newFieldState]) => {
    newFieldState.initialValue = oldState[path]?.initialValue
    newFieldState.value = oldState[path]?.value

    const oldErrorPaths: string[] = []
    const newErrorPaths: string[] = []

    if (oldState[path]?.errorPaths instanceof Set) {
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
