import path from 'path'
import { sanitizeFilename } from 'payload/shared'

import { sanitizePrefix } from './sanitizePrefix.js'

type BuildFilePathDataArgs = {
  collectionPrefix?: string
  docPrefix?: string
  filename: string
  useCompositePrefixes?: boolean
}

type BuildFilePathDataResult = {
  /**
   * @deprecated Use `storageFilePath` instead.
   *
   * The full path to the file within the storage backend.
   */
  fileKey: string
  sanitizedCollectionPrefix: string
  sanitizedDocPrefix: string
  sanitizedFilename: string
  /**
   * The full path to the file within the storage backend.
   */
  storageFilePath: string
}

export function isStoragePathWithinCollectionPrefix({
  collectionPrefix,
  docPrefix,
}: {
  collectionPrefix?: string
  docPrefix: string
}): boolean {
  const safeCollectionPrefix = sanitizePrefix(collectionPrefix || '')

  return (
    !safeCollectionPrefix ||
    docPrefix === safeCollectionPrefix ||
    docPrefix.startsWith(`${safeCollectionPrefix}/`)
  )
}

/**
 * Resolves where a new upload must be stored, without needing a filename.
 *
 * In non-composite mode (useCompositePrefixes: false), docPrefix is treated as a complete prefix
 * when it is already within collectionPrefix and is otherwise nested beneath collectionPrefix.
 * In composite mode (useCompositePrefixes: true), the collection prefix is joined when the key is
 * built, so the persisted document prefix stays relative to it.
 *
 * Prefix-only callers (such as the upload prefix hooks) use this directly; use
 * {@link buildUploadStoragePathData} when a full object key is needed.
 */
export function buildUploadPrefix({
  collectionPrefix,
  docPrefix,
  useCompositePrefixes = false,
}: Omit<BuildFilePathDataArgs, 'filename'>): {
  sanitizedCollectionPrefix: string
  sanitizedDocPrefix: string
  uploadPrefix: string
} {
  const safeCollectionPrefix = sanitizePrefix(collectionPrefix || '')
  const safeDocPrefix = sanitizePrefix(docPrefix || '')
  const uploadPrefix =
    safeDocPrefix &&
    !isStoragePathWithinCollectionPrefix({
      collectionPrefix: safeCollectionPrefix,
      docPrefix: safeDocPrefix,
    })
      ? path.posix.join(safeCollectionPrefix, safeDocPrefix)
      : safeDocPrefix || safeCollectionPrefix

  return {
    sanitizedCollectionPrefix: safeCollectionPrefix,
    sanitizedDocPrefix: !useCompositePrefixes && safeDocPrefix ? uploadPrefix : safeDocPrefix,
    uploadPrefix,
  }
}

/**
 * Resolves a new upload destination beneath the configured collection prefix.
 * Both prefixes are passed through {@link sanitizePrefix} so keys stay normalized.
 */
export function buildUploadStoragePathData({
  collectionPrefix,
  docPrefix,
  filename,
  useCompositePrefixes = false,
}: BuildFilePathDataArgs): BuildFilePathDataResult {
  const { sanitizedCollectionPrefix, sanitizedDocPrefix, uploadPrefix } = buildUploadPrefix({
    collectionPrefix,
    docPrefix,
    useCompositePrefixes,
  })
  const safeFilename = sanitizeFilename(filename)

  const storageFilePath = useCompositePrefixes
    ? path.posix.join(sanitizedCollectionPrefix, sanitizedDocPrefix, safeFilename)
    : path.posix.join(uploadPrefix, safeFilename)

  return {
    fileKey: storageFilePath,
    sanitizedCollectionPrefix,
    sanitizedDocPrefix,
    sanitizedFilename: safeFilename,
    storageFilePath,
  }
}

/**
 * Resolves the exact location represented by persisted upload metadata.
 * Non-composite document prefixes historically override the collection prefix;
 * keep that behavior for reads, URLs, and cleanup of pre-upgrade files.
 * New writes must use buildUploadStoragePathData instead.
 */
export function buildStoragePathData({
  collectionPrefix,
  docPrefix,
  filename,
  useCompositePrefixes = false,
}: BuildFilePathDataArgs): BuildFilePathDataResult {
  const sanitizedCollectionPrefix = sanitizePrefix(collectionPrefix || '')
  const sanitizedDocPrefix = sanitizePrefix(docPrefix || '')
  const sanitizedFilename = sanitizeFilename(filename)
  const storageFilePath = useCompositePrefixes
    ? path.posix.join(sanitizedCollectionPrefix, sanitizedDocPrefix, sanitizedFilename)
    : path.posix.join(sanitizedDocPrefix || sanitizedCollectionPrefix, sanitizedFilename)

  return {
    fileKey: storageFilePath,
    sanitizedCollectionPrefix,
    sanitizedDocPrefix,
    sanitizedFilename,
    storageFilePath,
  }
}
