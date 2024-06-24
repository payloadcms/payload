import { initOperation } from 'payload'

import type { CollectionRouteHandler } from '../types.js'

import { headersWithCors } from '../../../utilities/headersWithCors.js'

export const init: CollectionRouteHandler = async ({ collection, req }) => {
  const initialized = await initOperation({
    collection: collection.config.slug,
    req,
  })

  return Response.json(
    { initialized },
    {
      headers: headersWithCors({
        headers: new Headers(),
        req,
      }),
    },
  )
}
