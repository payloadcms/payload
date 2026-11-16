import { sanitizePrefix } from './sanitizePrefix.js'

/**
 * Joins the semantic prefix and the `_objectKey` segment into the object's folder; either may be empty.
 */
export const buildPrefixWithObjectKey = ({
  objectKey,
  prefix,
}: {
  objectKey?: string
  prefix?: string
}): string => {
  const safePrefix = sanitizePrefix(prefix ?? '')
  const safeObjectKey = sanitizePrefix(objectKey ?? '')

  if (safePrefix && safeObjectKey) {
    return `${safePrefix}/${safeObjectKey}`
  }

  return safePrefix || safeObjectKey
}
