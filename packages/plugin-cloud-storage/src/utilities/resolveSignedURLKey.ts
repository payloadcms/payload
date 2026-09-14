import type { PayloadRequest } from 'payload'

import { randomUUID } from 'node:crypto'
import { createClientUploadReceipt, getSafeFileName } from 'payload/internal'
import { getSanitizedUploadFilename } from 'payload/shared'

import type { UploadReference } from '../types.js'

import { getFileKey } from './getFileKey.js'
import { sanitizePrefix } from './sanitizePrefix.js'

type Args = {
  collectionPrefix?: string
  collectionSlug: string
  docPrefix?: string
  filename: string
  req: PayloadRequest
  useCompositePrefixes?: boolean
}

/**
 * Resolves the storage key for an upload-instructions request, deduping
 * the filename via {@link getSafeFileName} so a duplicate upload does not
 * overwrite an existing blob.
 *
 * A unique per-upload segment is included in the storage prefix so each issued
 * key is distinct. The stored `filename` stays clean — the per-upload entropy
 * lives in the prefix, not the filename.
 *
 * The resolved `sanitizedFilename` is returned so the browser-side handler
 * can update the form via `updateFilename`.
 */
export async function resolveSignedURLKey({
  collectionPrefix = '',
  collectionSlug,
  docPrefix,
  filename,
  req,
  useCompositePrefixes = false,
}: Args): Promise<{
  fileKey: string
  sanitizedDocPrefix: string
  sanitizedFilename: string
  uploadReference: UploadReference
}> {
  // Sanitize with the same helper generateFileData uses for the DB filename so the storage key
  // and doc.filename stay in sync (#16694).
  const sanitizedFilename = await getSafeFileName({
    collectionSlug,
    desiredFilename: getSanitizedUploadFilename(filename),
    req,
  })

  const _objectKey = randomUUID()
  const baseDocPrefix = useCompositePrefixes ? docPrefix : docPrefix || collectionPrefix
  // Per-upload segment lives in the key; it is persisted in `_objectKey`, keeping `prefix` semantic.
  const keyedDocPrefix = baseDocPrefix ? `${baseDocPrefix}/${_objectKey}` : _objectKey

  const { fileKey } = getFileKey({
    collectionPrefix,
    docPrefix: keyedDocPrefix,
    filename: sanitizedFilename,
    useCompositePrefixes,
  })

  const sanitizedDocPrefix = sanitizePrefix(baseDocPrefix || '')

  const uploadReference = {
    _objectKey,
    prefix: sanitizedDocPrefix,
    signedReceipt: createClientUploadReceipt({
      _objectKey,
      collectionSlug,
      fileKey,
      filename: sanitizedFilename,
      filePrefix: sanitizedDocPrefix,
      req,
    }),
  }

  return { fileKey, sanitizedDocPrefix, sanitizedFilename, uploadReference }
}
