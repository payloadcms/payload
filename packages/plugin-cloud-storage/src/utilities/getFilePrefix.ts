import type { CollectionConfig, PayloadRequest, UploadConfig } from 'payload'

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
    return clientUploadContext.prefix
  }

  const imageSizes = (collection?.upload as UploadConfig)?.imageSizes || []

  const files = await req.payload.find({
    collection: collection.slug,
    depth: 0,
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
  return prefix ? (prefix as string) : ''
}
