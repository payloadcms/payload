import type { PayloadRequestWithData } from '../../types/index.js'

export const initOperation = async (args: {
  collection: string
  req: PayloadRequestWithData
}): Promise<boolean> => {
  const { collection: slug, req } = args

  const doc = await req.payload.db.findOne({
    collection: slug,
    req,
  })

  return !!doc
}
