import type { PayloadRequest } from '../../express/types'

async function init(args: { collection: string; req: PayloadRequest }): Promise<boolean> {
  const { collection: slug, req } = args

  const collectionConfig = req.payload.config.collections[slug]

  let doc: Record<string, unknown> | undefined
  if (collectionConfig?.db?.findOne) {
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

export default init
