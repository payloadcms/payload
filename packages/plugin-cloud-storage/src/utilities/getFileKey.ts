import path from 'path'

import { sanitizePrefix } from './sanitizePrefix.js'

type GetFileKeyArgs = {
  collectionPrefix?: string
  docPrefix?: string
  filename: string
  useCompositePrefixes?: boolean
}

/**
 * Computes the file key (path) for storage.
 *
 * In non-composite mode (useCompositePrefixes: false), docPrefix overrides collectionPrefix.
 * In composite mode (useCompositePrefixes: true), both are combined.
 * Both prefixes are passed through {@link sanitizePrefix} so keys stay normalized.
 */
export function getFileKey({
  collectionPrefix,
  docPrefix,
  filename,
  useCompositePrefixes = false,
}: GetFileKeyArgs): string {
  const safeCollectionPrefix = sanitizePrefix(collectionPrefix || '')
  const safeDocPrefix = sanitizePrefix(docPrefix || '')

  if (useCompositePrefixes) {
    return path.posix.join(safeCollectionPrefix, safeDocPrefix, filename)
  }

  return path.posix.join(safeDocPrefix || safeCollectionPrefix, filename)
}
