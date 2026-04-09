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
 * In legacy mode (useCompositePrefixes: false), docPrefix overrides collectionPrefix.
 * In compositional mode (useCompositePrefixes: true), both are combined.
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
