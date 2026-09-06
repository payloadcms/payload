import type { PayloadRequest } from 'payload'

import { getSafeFileName, sanitizeUploadFilename } from 'payload/internal'

import { getFileKey } from './getFileKey.js'

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
  // Sanitize with the same logic used by `generateFileData.ts` so the
  // storage key matches the DB filename for clientUploads.
  const sanitized = sanitizeUploadFilename(filename)

  const dedupedFilename = await getSafeFileName({
    collectionSlug,
    desiredFilename: sanitized,
    prefix: docPrefix,
    req,
  })

  const { fileKey, sanitizedDocPrefix } = getFileKey({
    collectionPrefix,
    docPrefix,
    filename: dedupedFilename,
    useCompositePrefixes,
  })

  return { fileKey, sanitizedDocPrefix, sanitizedFilename: dedupedFilename }
}
