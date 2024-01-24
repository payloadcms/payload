import type { CollectionConfig, IncomingUploadType, PayloadRequest } from 'payload/types'

export async function getFilePrefix({
  collection,
  req,
}: {
  collection: CollectionConfig
  req: PayloadRequest
}): Promise<string> {
  const imageSizes = (collection?.upload as IncomingUploadType)?.imageSizes || []
  const { searchParams } = new URL(req.url)
  const filename = searchParams.get('filename')

  const files = await req.payload.find({
    collection: collection.slug,
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
