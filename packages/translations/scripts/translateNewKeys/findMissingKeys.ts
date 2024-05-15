import type { GenericTranslationsObject } from '../../src/types.js'

/**
 * Returns keys which are present in baseObj but not in targetObj
 */
export function findMissingKeys(
  baseObj: GenericTranslationsObject,
  targetObj: GenericTranslationsObject,
  prefix = '',
): string[] {
  let missingKeys = []

  for (const key in baseObj) {
    const baseValue = baseObj[key]
    const targetValue = targetObj[key]
    if (typeof baseValue === 'object') {
      missingKeys = missingKeys.concat(
        findMissingKeys(
          baseValue,
          typeof targetValue === 'object' && targetValue ? targetValue : {},
          `${prefix}${key}.`,
        ),
      )
    } else if (!(key in targetObj)) {
      missingKeys.push(`${prefix}${key}`)
    }
  }

  return missingKeys
}
