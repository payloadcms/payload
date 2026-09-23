import type { PayloadRequest, Where } from '../types/index.js'

type Args = {
  collectionSlug: string
  /**
   * When provided, this document ID is excluded from the filename lookup.
   * Use this during update operations so a document does not collide with its
   * own existing filename and receive a spurious `-1` suffix.
   */
  docId?: number | string
  filename: string
  matchAnyPrefix?: boolean
  path: string
  prefix?: string
  req: PayloadRequest
}

export const docWithFilenameExists = async ({
  collectionSlug,
  docId,
  filename,
  matchAnyPrefix = false,
  prefix,
  req,
}: Args): Promise<boolean> => {
  const collection = req.payload.collections[collectionSlug]?.config
  const upload = collection?.upload
  const hasPrefixField = (collection?.fields ?? []).some(
    (field) => 'name' in field && field.name === 'prefix',
  )
  const filenameCondition: Where = {
    or: [
      {
        filename: {
          equals: filename,
        },
      },
      ...(upload && typeof upload === 'object' && upload.imageSizes
        ? upload.imageSizes.map(({ name }) => ({
            [`sizes.${name}.filename`]: { equals: filename },
          }))
        : []),
    ],
  }

  const where: Where =
    !matchAnyPrefix && typeof prefix === 'string' && hasPrefixField
      ? { and: [filenameCondition, { prefix: { equals: prefix } }] }
      : filenameCondition

  if (docId !== undefined) {
    where.id = { not_equals: docId }
  }

  const doc = await req.payload.db.findOne({
    collection: collectionSlug,
    req,
    where,
  })

  return !!doc
}
