import type { CollectionConfig, IncomingUploadType, PayloadRequest } from 'payload/types'

export async function getFilePrefix({
  collection,
  req,
}: {
  collection: CollectionConfig
  req: PayloadRequest
}): Promise<string> {
  const imageSizes = (collection?.upload as IncomingUploadType)?.imageSizes || []
  const files = await req.payload.find({
    collection: collection.slug,
    depth: 0,
    limit: 1,
    pagination: false,
    where: {
      or: [
        {
          filename: { equals: req.params.filename },
        },
        ...imageSizes.map((imageSize) => ({
          [`sizes.${imageSize.name}.filename`]: { equals: req.params.filename },
        })),
      ],
    },
  })
  const prefix = files?.docs?.[0]?.prefix
  return prefix ? (prefix as string) : ''
}
