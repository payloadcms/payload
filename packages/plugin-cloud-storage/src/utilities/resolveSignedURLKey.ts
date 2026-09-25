import type { PayloadRequest } from 'payload'

import { randomUUID } from 'node:crypto'
import { createClientUploadReceipt, getSafeFileName } from 'payload/internal'
import { getSanitizedUploadFilename } from 'payload/shared'

import type { UploadReference } from '../types.js'

import { buildUploadPrefix, buildUploadStoragePathData } from './buildStoragePathData.js'

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
 * A unique per-upload segment is included in the storage key so each issued
 * key is distinct. The stored `filename` stays clean and the semantic `prefix`
 * stays exactly what the collection configured — the per-upload entropy is
 * persisted separately in `_objectKey`.
 *
 * The resolved `sanitizedFilename` is returned so the browser-side handler
 * can update the form via `updateFilename`.
 *
 * The semantic prefix is resolved with {@link buildUploadPrefix} and the final
 * key with {@link buildUploadStoragePathData}, so the receipt only ever signs a key
 * beneath the configured collection prefix.
 */
export async function resolveSignedURLKey({
  collectionPrefix = '',
  collectionSlug,
  docPrefix,
  filename,
  req,
  useCompositePrefixes = false,
}: Args): Promise<{
  sanitizedDocPrefix: string
  sanitizedFilename: string
  storageFilePath: string
  uploadReference: UploadReference
}> {
  // Sanitize with the same helper generateFileData uses for the DB filename so the storage key
  // and doc.filename stay in sync (#16694).
  const sanitizedFilename = await getSafeFileName({
    collectionSlug,
    desiredFilename: getSanitizedUploadFilename(filename),
    req,
  })

  const rawBaseDocPrefix = useCompositePrefixes ? docPrefix : docPrefix || collectionPrefix
  const { sanitizedDocPrefix } = buildUploadPrefix({
    collectionPrefix,
    docPrefix: rawBaseDocPrefix,
    useCompositePrefixes,
  })

  const _objectKey = randomUUID()
  // Per-upload segment lives in the key; it is persisted in `_objectKey`, keeping `prefix` semantic.
  const keyedDocPrefix = sanitizedDocPrefix ? `${sanitizedDocPrefix}/${_objectKey}` : _objectKey

  const { storageFilePath } = buildUploadStoragePathData({
    collectionPrefix,
    docPrefix: keyedDocPrefix,
    filename: sanitizedFilename,
    useCompositePrefixes,
  })

  const uploadReference = {
    _objectKey,
    prefix: sanitizedDocPrefix,
    signedReceipt: createClientUploadReceipt({
      _objectKey,
      collectionSlug,
      filename: sanitizedFilename,
      filePrefix: sanitizedDocPrefix,
      req,
      storageFilePath,
    }),
  }

  return { sanitizedDocPrefix, sanitizedFilename, storageFilePath, uploadReference }
}
