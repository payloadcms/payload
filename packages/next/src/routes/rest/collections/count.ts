import type { Where } from 'payload'

import httpStatus from 'http-status'
import { countOperation } from 'payload'

import type { CollectionRouteHandler } from '../types.js'

export const count: CollectionRouteHandler = async ({ collection, req }) => {
  const { draft, locale, where } = req.query as {
    draft?: string
    locale?: string
    where?: Where
  }

  const result = await countOperation({
    collection,
    draft: draft === 'true',
    locale,
    req,
    where,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
