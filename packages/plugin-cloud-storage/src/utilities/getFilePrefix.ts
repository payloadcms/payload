import type { CollectionConfig, PayloadRequestWithData, UploadConfig } from 'payload'

export async function getFilePrefix({
  collection,
  filename,
  req,
}: {
  collection: CollectionConfig
  filename: string
  req: PayloadRequestWithData
}): Promise<string> {
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
