import type { FormState } from 'payload'

import type { ADD_SERVER_ERRORS } from '../types.js'

export const addServerErrors = (state: FormState, action: ADD_SERVER_ERRORS): FormState => {
  let newState = { ...state }

  const errorPaths: { fieldErrorPath: string; parentPath: string }[] = []

  action.errors.forEach(({ message, path: fieldPath }) => {
    newState[fieldPath] = {
      ...(newState[fieldPath] || {
        initialValue: null,
        value: null,
      }),
      errorMessage: message,
      valid: false,
    }

    const segments = fieldPath.split('.')
    if (segments.length > 1) {
      errorPaths.push({
        fieldErrorPath: fieldPath,
        parentPath: segments.slice(0, segments.length - 1).join('.'),
      })
    }
  })

  newState = Object.entries(newState).reduce((acc, [path, fieldState]) => {
    const fieldErrorPaths = errorPaths.reduce((errorACC, { fieldErrorPath, parentPath }) => {
      if (parentPath.startsWith(path)) {
        errorACC.push(fieldErrorPath)
      }
      return errorACC
    }, [])

    let changed = false

    if (fieldErrorPaths.length > 0) {
      const newErrorPaths = Array.isArray(fieldState.errorPaths) ? fieldState.errorPaths : []

      fieldErrorPaths.forEach((fieldErrorPath) => {
        if (!newErrorPaths.includes(fieldErrorPath)) {
          newErrorPaths.push(fieldErrorPath)
          changed = true
        }
      })

      if (changed) {
        acc[path] = {
          ...fieldState,
          errorPaths: newErrorPaths,
        }
      }
    }

    if (!changed) {
      acc[path] = fieldState
    }

    return acc
  }, {})

  return newState
}
