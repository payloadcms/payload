import type { FormState } from 'payload'

import { dequal } from 'dequal/lite'

/**
 * Determines if the form state change is only due to error messages being added/removed,
 * without any actual field value changes from user interaction.
 *
 * This is useful for detecting when server validation errors are added to the form state
 * versus when a user actually modifies field values.
 */
export const isOnlyErrorStateChange = (prev: FormState, current: FormState): boolean => {
  const prevWithoutErrors = Object.entries(prev).reduce((acc, [path, field]) => {
    const { errorMessage, valid, ...rest } = field
    acc[path] = rest
    return acc
  }, {} as FormState)

  const currentWithoutErrors = Object.entries(current).reduce((acc, [path, field]) => {
    const { errorMessage, valid, ...rest } = field
    acc[path] = rest
    return acc
  }, {} as FormState)

  return dequal(prevWithoutErrors, currentWithoutErrors)
}
