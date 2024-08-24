import type { Where } from 'payload'

import httpStatus from 'http-status'
import { countOperation } from 'payload'

import type { CollectionRouteHandler } from '../types.js'

export const count: CollectionRouteHandler = async ({ collection, req }) => {
  const { cache, where } = req.query as {
    cache?: string
    where?: Where
  }

  const result = await countOperation({
    cache: cache === 'true',
    collection,
    req,
    where,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
