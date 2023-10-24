import type { IncomingUploadType } from 'payload/dist/uploads/types'
import type { CollectionConfig, PayloadRequest } from 'payload/types'

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
  return files?.docs?.[0]?.prefix || ''
}
