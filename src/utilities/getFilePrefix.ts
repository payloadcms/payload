import type { CollectionConfig, PayloadRequest } from 'payload/types'
import { IncomingUploadType } from 'payload/dist/uploads/types'

export async function getFilePrefix({
  req,
  collection,
}: {
  req: PayloadRequest
  collection: CollectionConfig
}): Promise<string> {
  const imageSizes = (collection?.upload as IncomingUploadType)?.imageSizes || []
  const files = await req.payload.find({
    collection: collection.slug,
    where: {
      or: [
        {
          filename: { equals: req.params.filename },
        },
        ...imageSizes.map(imageSize => ({
          [`sizes.${imageSize.name}.filename`]: { equals: req.params.filename },
        })),
      ],
    },
  })
  return files?.docs?.[0]?.prefix || ''
}
