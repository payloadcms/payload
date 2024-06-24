import type { Where } from 'payload/types'

import httpStatus from 'http-status'
import { countOperation } from 'payload/operations'

import type { CollectionRouteHandler } from '../types.js'

export const count: CollectionRouteHandler = async ({ collection, req }) => {
  const { where } = req.query as {
    where?: Where
  }

  const result = await countOperation({
    collection,
    req,
    where,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
