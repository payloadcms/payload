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
  path: string
  prefix?: string
  req: PayloadRequest
}

export const docWithFilenameExists = async ({
  collectionSlug,
  docId,
  filename,
  prefix,
  req,
}: Args): Promise<boolean> => {
  const where: Where = {
    filename: {
      equals: filename,
    },
  }

  if (prefix) {
    where.prefix = { equals: prefix }
  }

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
