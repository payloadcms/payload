import { initOperation } from 'payload/operations'

import type { CollectionRouteHandler } from '../types.js'

export const init: CollectionRouteHandler = async ({ collection, req }) => {
  const initialized = await initOperation({
    collection: collection.config.slug,
    req,
  })

  return Response.json({ initialized })
}
