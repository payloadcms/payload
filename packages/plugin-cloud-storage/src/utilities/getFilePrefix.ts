import type { CollectionConfig, PayloadRequest, UploadConfig } from 'payload'

/**
 * Normalizes a storage prefix to ensure only valid path segments are included.
 */
function sanitizePrefix(prefix: string): string {
  return (
    prefix
      .replace(/\\/g, '/')
      .split('/')
      .filter((segment) => segment !== '..' && segment !== '.')
      .join('/')
      .replace(/^\/+/, '')
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1f\x80-\x9f]/g, '')
  )
}

export async function getFilePrefix({
  clientUploadContext,
  collection,
  filename,
  req,
}: {
  clientUploadContext?: unknown
  collection: CollectionConfig
  filename: string
  req: PayloadRequest
}): Promise<string> {
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

  if (files?.docs?.length) {
    const prefix = files.docs[0].prefix
    return prefix ? sanitizePrefix(prefix as string) : ''
  }

  // Document not found — likely mid-create transaction.
  // Fall back to the collection's configured default prefix.
  for (const field of collection.fields) {
    if ('name' in field && field.name === 'prefix' && 'defaultValue' in field) {
      const defaultPrefix = field.defaultValue
      if (typeof defaultPrefix === 'string' && defaultPrefix) {
        return sanitizePrefix(defaultPrefix)
      }
    }
  }

  return ''
}
