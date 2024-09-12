import type { PayloadRequest } from '../express/types'

type Args = {
  collectionSlug: string
  filename: string
  path: string
  req: PayloadRequest
}

const docWithFilenameExists = async ({ collectionSlug, filename, req }: Args): Promise<boolean> => {
  const collectionConfig = req.payload.config.collections[collectionSlug]
  const dbArgs = {
    collection: collectionSlug,
    req,
    where: {
      filename: {
        equals: filename,
      },
    },
  }
  let doc: any
  if (collectionConfig?.db?.findOne) {
    doc = await collectionConfig.db.findOne(dbArgs)
  } else {
    doc = await req.payload.db.findOne(dbArgs)
  }
  if (doc) return true

  return false
}

export default docWithFilenameExists
