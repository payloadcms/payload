/**
 * Useful when parsing query parameters where booleans are represented as strings.
 * Falls back to `undefined` to allow default handling elsewhere.
 */
export const parseBooleanString = (value: null | string | undefined): boolean | undefined => {
  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  return undefined
}
