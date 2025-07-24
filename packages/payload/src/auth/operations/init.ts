import type { PayloadRequest, Where } from '../../types/index.js'

import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'

export const initOperation = async (args: {
  collection: string
  req: PayloadRequest
  trash?: boolean
}): Promise<boolean> => {
  const { collection: slug, req, trash = false } = args

  const collectionConfig = req.payload.config.collections?.find((c) => c.slug === slug)

  // Exclude trashed documents unless `trash: true`
  const where: Where = appendNonTrashedFilter({
    enableTrash: Boolean(collectionConfig?.trash),
    trash,
    where: {},
  })

  const doc = await req.payload.db.findOne({
    collection: slug,
    req,
    where,
  })

  return !!doc
}
