/**
 * Gets a field's data by its path from a nested data object.
 * To get data from flattened form state, use `getFormStateDataByPath` instead.
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
 * ```
 */
export const getDataByPath = <T = unknown>(args: {
  data: Record<string, any>
  /**
   * Optional locale for localized fields, e.g. "en", etc.
   */
  locale?: string
  /**
   * The path to the desired field, e.g. "group.array.0.text", etc.
   */
  path: string
}): T => {
  const { data, path } = args

  const pathSegments = path.split('.')

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
