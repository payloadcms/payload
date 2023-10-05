import type { PayloadRequest } from '../../express/types'

async function init(args: { collection: string; req: PayloadRequest }): Promise<boolean> {
  const { collection: slug, req } = args

  const doc = await req.payload.db.findOne({
    collection: slug,
    req,
  })

  return !!doc
}

export default init
