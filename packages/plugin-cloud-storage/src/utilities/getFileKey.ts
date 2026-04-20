import path from 'path'
import { sanitizeFilename } from 'payload/shared'

import { sanitizePrefix } from './sanitizePrefix.js'

type GetFileKeyArgs = {
  collectionPrefix?: string
  docPrefix?: string
  filename: string
  useCompositePrefixes?: boolean
}

type GetFileKeyResult = {
  fileKey: string
  sanitizedCollectionPrefix: string
  sanitizedDocPrefix: string
  sanitizedFilename: string
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
}: GetFileKeyArgs): GetFileKeyResult {
  const safeCollectionPrefix = sanitizePrefix(collectionPrefix || '')
  const safeDocPrefix = sanitizePrefix(docPrefix || '')
  const safeFilename = sanitizeFilename(filename)

  const fileKey = useCompositePrefixes
    ? path.posix.join(safeCollectionPrefix, safeDocPrefix, safeFilename)
    : path.posix.join(safeDocPrefix || safeCollectionPrefix, safeFilename)

  return {
    fileKey,
    sanitizedCollectionPrefix: safeCollectionPrefix,
    sanitizedDocPrefix: safeDocPrefix,
    sanitizedFilename: safeFilename,
  }
}
