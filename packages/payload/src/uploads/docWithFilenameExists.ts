import type { PayloadRequest } from '../types/index.js'

type Args = {
  collectionSlug: string
  filename: string
  path: string
  req: PayloadRequest
}

const docWithFilenameExists = async ({ collectionSlug, filename, req }: Args): Promise<boolean> => {
  const doc = await req.payload.db.findOne({
    collection: collectionSlug,
    req,
    where: {
      filename: {
        equals: filename,
      },
    },
  })
  if (doc) {
    return true
  }

  return false
}

export default docWithFilenameExists
