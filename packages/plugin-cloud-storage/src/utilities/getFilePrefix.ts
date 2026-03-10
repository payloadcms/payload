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
  const prefix = files?.docs?.[0]?.prefix
  return prefix ? sanitizePrefix(prefix as string) : ''
}
