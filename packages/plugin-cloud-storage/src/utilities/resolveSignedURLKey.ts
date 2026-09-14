import type { PayloadRequest } from 'payload'

import { randomUUID } from 'crypto'
import { createClientUploadReceipt, getSafeFileName } from 'payload/internal'
import { getSanitizedUploadFilename } from 'payload/shared'

import type { ClientUploadContext } from '../types.js'

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
 * Resolves the storage key for a clientUploads signed-URL request, deduping
 * the filename via {@link getSafeFileName} so a duplicate upload does not
 * overwrite an existing blob.
 *
 * A per-upload segment is persisted in `_objectKey` (not `prefix`), so the stored `prefix`
 * and `filename` stay clean.
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
}: Args) {
  // Sanitize with the same helper generateFileData uses for the DB filename so the storage key
  // and doc.filename stay in sync (#16694).
  const sanitizedFilename = await getSafeFileName({
    collectionSlug,
    desiredFilename: getSanitizedUploadFilename(filename),
    req,
  })

  const _objectKey = randomUUID()
  const baseDocPrefix = useCompositePrefixes ? docPrefix : docPrefix || collectionPrefix
  // Persisted in `_objectKey`, keeping `prefix` semantic.
  const keyedDocPrefix = baseDocPrefix ? `${baseDocPrefix}/${_objectKey}` : _objectKey

  const { fileKey } = getFileKey({
    collectionPrefix,
    docPrefix: keyedDocPrefix,
    filename: sanitizedFilename,
    useCompositePrefixes,
  })

  const sanitizedDocPrefix = sanitizePrefix(baseDocPrefix || '')

  const context = {
    _objectKey,
    prefix: sanitizedDocPrefix,
  }
  const clientUploadContext: ClientUploadContext = {
    ...context,
    signedReceipt: createClientUploadReceipt({
      collectionSlug,
      context,
      filename: sanitizedFilename,
      req,
    }),
  }

  return { _objectKey, clientUploadContext, fileKey, sanitizedDocPrefix, sanitizedFilename }
}
