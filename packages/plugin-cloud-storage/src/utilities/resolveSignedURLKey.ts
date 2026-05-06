import type { PayloadRequest } from 'payload'

import { getSafeFileName } from 'payload/internal'

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
 * Resolves the storage key for a clientUploads signed-URL request, deduping
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
  const sanitizedFilename = await getSafeFileName({
    collectionSlug,
    desiredFilename: filename,
    prefix: docPrefix,
    req,
  })

  const { fileKey, sanitizedDocPrefix } = getFileKey({
    collectionPrefix,
    docPrefix,
    filename: sanitizedFilename,
    useCompositePrefixes,
  })

  return { fileKey, sanitizedDocPrefix, sanitizedFilename }
}
