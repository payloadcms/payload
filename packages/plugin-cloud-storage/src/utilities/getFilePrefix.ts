import type { CollectionConfig, PayloadRequest, UploadConfig } from 'payload'

/**
 * Normalizes a storage prefix to ensure only valid path segments are included.
 */
function sanitizePrefix(prefix: string): string {
  let decodedPrefix: string

  try {
    decodedPrefix = decodeURIComponent(prefix)
  } catch {
    return ''
  }

  // Reject multi-encoded values (e.g. `%252f`) by allowing only a single decode pass.
  if (/%[0-9a-f]{2}/i.test(decodedPrefix)) {
    return ''
  }

  return (
    decodedPrefix
      .replace(/\\/g, '/')
      .split('/')
      .filter((segment) => segment !== '..' && segment !== '.')
      .join('/')
      .replace(/^\/+/, '')
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1f\x80-\x9f]/g, '')
  )
}

/**
 * Resolves the file prefix from the highest-priority available source and
 * always returns a sanitized value.
 *
 * Resolution order:
 * 1. `prefixQueryParam`
 * 2. `clientUploadContext.prefix`
 * 3. Stored document `prefix` from the database
 *
 * Query / client input is decoded once; malformed and multi-encoded values are
 * rejected. Sanitization then normalizes slashes, removes `.` / `..` path
 * traversal segments, strips leading slashes, and removes control characters.
 */
export async function getFilePrefix({
  clientUploadContext,
  collection,
  filename,
  prefixQueryParam,
  req,
}: {
  clientUploadContext?: unknown
  collection: CollectionConfig
  filename: string
  prefixQueryParam?: string
  req: PayloadRequest
}): Promise<string> {
  if (typeof prefixQueryParam === 'string') {
    return sanitizePrefix(prefixQueryParam)
  }

  // Prioritize from clientUploadContext if there is:
  if (
    clientUploadContext &&
    typeof clientUploadContext === 'object' &&
    'prefix' in clientUploadContext &&
    typeof clientUploadContext.prefix === 'string'
  ) {
    return sanitizePrefix(clientUploadContext.prefix)
  }

  const imageSizes = (collection?.upload as UploadConfig)?.imageSizes || []

  const files = await req.payload.find({
    collection: collection.slug,
    depth: 0,
    draft: true,
    limit: 1,
    pagination: false,
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
