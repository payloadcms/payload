import type { CollectionConfig, PayloadRequest, UploadConfig } from 'payload'

import { sanitizePrefix } from './sanitizePrefix.js'

/**
 * Resolves the file prefix from the highest-priority available source and
 * always returns a sanitized value.
 *
 * Resolution order:
 * 1. `prefixQueryParam`
 * 2. `uploadReference.prefix`
 * 3. Stored document `prefix` from the database
 *
 * Resolved values are passed through `sanitizePrefix`.
 */
export async function getFilePrefix({
  collection,
  filename,
  prefixQueryParam,
  req,
  uploadReference,
}: {
  collection: CollectionConfig
  filename: string
  prefixQueryParam?: string
  req: PayloadRequest
  uploadReference?: unknown
}): Promise<string> {
  if (typeof prefixQueryParam === 'string') {
    return sanitizePrefix(prefixQueryParam)
  }

  // Prioritize the upload reference prefix if there is one.
  if (
    uploadReference &&
    typeof uploadReference === 'object' &&
    'prefix' in uploadReference &&
    typeof uploadReference.prefix === 'string'
  ) {
    return sanitizePrefix(uploadReference.prefix)
  }

  const imageSizes = (collection?.upload as UploadConfig)?.imageSizes || []

  const files = await req.payload.find({
    collection: collection.slug,
    depth: 0,
    draft: true,
    limit: 1,
    pagination: false,
    req,
    where: {
      or: [
        {
          filename: { equals: filename },
        },
        ...imageSizes.map((imageSize) => ({
          [`sizes.${imageSize.name}.filename`]: { equals: filename },
        })),
      ],
    },
  })
  const prefix = files?.docs?.[0]?.prefix
  return prefix ? sanitizePrefix(prefix as string) : ''
}
