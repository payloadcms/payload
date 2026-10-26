import type { ParsedArgs } from 'minimist'

/**
 * Normalizes a parsed CLI arg key to camelCase, e.g. `force-accept-warning` -> `forceAcceptWarning`
 */
export const formatArgKey = (key: string): null | string => {
  const formattedKey = key.replace(/^[-_]+/, '')
  if (!formattedKey) {
    return null
  }

  return formattedKey
    .split('-')
    .map((word, index) =>
      index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join('')
}

/**
 * Whether `--force-accept-warning` was enabled.
 *
 * minimist parses `--no-force-accept-warning` as `false` and `--force-accept-warning=false`
 * as `'false'`, so the flag has to be checked by value, not just by key.
 */
export const getForceAcceptWarning = (parsedArgs: ParsedArgs): boolean =>
  Object.entries(parsedArgs).some(
    ([key, value]) =>
      (key === 'forceAcceptWarning' || formatArgKey(key) === 'forceAcceptWarning') &&
      (value === true || value === 'true'),
  )
