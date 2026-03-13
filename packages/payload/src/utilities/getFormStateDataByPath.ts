import type { FormState } from '../admin/types.js'

import { unflatten } from './unflatten.js'

/**
 * Gets a field's data by its path from form state, which is a flattened data object keyed by field paths.
 * To get data from nested document data, use `getDataByPath` instead.
 *
 * @example
 * ```ts
 * const formState = {
 *   'group.field': { value: 'value' },
 * }
 *
 * const value = getFormStateDataByPath({ formState, path: 'group.field' })
 * // value is 'value'
 * ```
 */
export const getFormStateDataByPath = <T = unknown>(args: {
  /**
   * The form state object to get the data from., e.g. `{ 'group.field': { value: 'value' } }`
   */
  formState: FormState
  /**
   * The path to the desired field, e.g. "group.array.0.text", etc.
   */
  path: string
}): T => {
  const { formState, path } = args

  const pathPrefixToRemove = path.substring(0, path.lastIndexOf('.') + 1)
  const pathSegments = path.split('.')

  const fieldName = pathSegments[pathSegments.length - 1]

  const siblingData: Record<string, any> = {}

  Object.keys(formState).forEach((key) => {
    if (!formState[key]?.disableFormData && (key.indexOf(`${path}.`) === 0 || key === path)) {
      siblingData[key.replace(pathPrefixToRemove, '')] = formState[key]?.value

      if (formState[key]?.rows && formState[key].rows.length === 0) {
        siblingData[key.replace(pathPrefixToRemove, '')] = []
      }
    }
  })

  const unflattenedData = unflatten(siblingData)

  return unflattenedData?.[fieldName!]
}
