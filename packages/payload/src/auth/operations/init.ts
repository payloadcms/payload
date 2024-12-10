import type { PayloadRequest } from '../../types/index.js'

export const initOperation = async (args: {
  collection: string
  req: PayloadRequest
}): Promise<boolean> => {
  const { collection: slug, req } = args

  const doc = await req.payload.db.findOne({
    collection: slug,
    req,
  })

  return !!doc
}
