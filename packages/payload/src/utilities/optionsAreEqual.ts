import type { Option } from '../fields/config/types.js'

/**
 * Extracts the value from an option-like object or string.
 */
const getOptionValue = (option: Option): string => {
  if (typeof option === 'string') {
    return option
  }
  return option.value
}

/**
 * Compares two arrays of options by their values.
 * Returns true if both arrays contain the same values (order-independent).
 */
export const optionsAreEqual = (
  options1: Option[] | undefined,
  options2: Option[] | undefined,
): boolean => {
  if (!options1 && !options2) {
    return true
  }

  if (!options1 || !options2) {
    return false
  }

  if (options1.length !== options2.length) {
    return false
  }

  const values1 = new Set(options1.map(getOptionValue))
  const values2 = new Set(options2.map(getOptionValue))

  if (values1.size !== values2.size) {
    return false
  }

  for (const value of values1) {
    if (!values2.has(value)) {
      return false
    }
  }

  return true
}
