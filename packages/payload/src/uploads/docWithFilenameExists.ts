import type { PayloadRequest, Where } from '../types/index.js'

type Args = {
  collectionSlug: string
  filename: string
  path: string
  prefix?: string
  req: PayloadRequest
}

export const docWithFilenameExists = async ({
  collectionSlug,
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

  const doc = await req.payload.db.findOne({
    collection: collectionSlug,
    req,
    where,
  })

  return !!doc
}
