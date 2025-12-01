import type { FormState } from '../admin/types.js'

import { unflatten } from './unflatten.js'

/**
 * Gets a field's data by its path from either:
 *  1. Form state (flattened data keyed by field path)
 *  2. Document data (nested data structure)
 *
 * @example
 * ```ts
 * // From document data
 * const data = {
 *   group: {
 *     field: 'value',
 *   },
 * }
 * const value = getDataByPath({ data, path: 'group.field' })
 * // value is 'value'
 *
 * // From form state
 * const formState = {
 *   'group.field': { value: 'value' },
 * }
 * const value = getDataByPath({ formState, path: 'group.field' })
 * // value is 'value'
 * ```
 */
export const getDataByPath = <T = unknown>(
  args: {
    /**
     * Optional locale for localized fields, e.g. "en", etc.
     */
    locale?: string
    /**
     * The path to the desired field, e.g. "group.array.0.text", etc.
     */
    path: string
  } & (
    | {
        /**
         * If `data` is provided, will deeply traverse the given object to get the value at `path`.
         * For example, given `path` of `group.field` and `data` of `{ group: { field: 'value' } }`, will return `'value'`.
         */
        data: Record<string, any>
        formState?: never
      }
    | {
        data?: never
        /**
         * If `formState` is provided, will
         */
        formState: FormState
      }
  ),
): T => {
  const { data, formState, path } = args

  const pathPrefixToRemove = path.substring(0, path.lastIndexOf('.') + 1)
  const pathSegments = path.split('.')

  const fieldName = pathSegments[pathSegments.length - 1]

  if (formState) {
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

  if (data) {
    let current: any = data

    for (const pathSegment of pathSegments) {
      if (current === undefined || current === null) {
        break
      }

      const rowIndex = Number(pathSegment)

      if (!Number.isNaN(rowIndex) && Array.isArray(current)) {
        current = current[rowIndex]
      } else {
        /**
         * Effectively make "current" become "siblingData" for the next iteration
         */
        const value = current[pathSegment]

        if (args.locale && value && typeof value === 'object' && value[args.locale]) {
          current = value[args.locale]
        } else {
          current = value
        }
      }
    }

    return current
  }

  return undefined as unknown as T
}
