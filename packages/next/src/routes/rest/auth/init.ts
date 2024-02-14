import { initOperation } from 'payload/operations'
import { CollectionRouteHandler } from '../types'

export const init: CollectionRouteHandler = async ({ req, collection }) => {
  const initialized = await initOperation({
    collection: collection.config.slug,
    req,
  })

  return Response.json({ initialized })
}
