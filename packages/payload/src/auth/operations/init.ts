import type { CollectionConfig } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'

export const initOperation = async (args: {
  collection: string
  req: PayloadRequest
}): Promise<boolean> => {
  const { collection: slug, req } = args

  const collectionConfig: CollectionConfig = req.payload.config.collections[slug]

  let doc: Record<string, unknown> | undefined
  // @ts-expect-error exists
  if (collectionConfig?.db?.findOne) {
    // @ts-expect-error exists
    doc = await collectionConfig.db.findOne({
      collection: slug,
      req,
    })
  } else {
    doc = await req.payload.db.findOne({
      collection: slug,
      req,
    })
  }

  return !!doc
}
