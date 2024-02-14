import httpStatus from 'http-status'

import { isNumber } from 'payload/utilities'
import { findOperation } from 'payload/operations'
import { CollectionRouteHandler } from '../types'

export const find: CollectionRouteHandler = async ({ req, collection }) => {
  const { searchParams } = req

  const depth = searchParams.get('depth')
  const limit = searchParams.get('limit')
  const page = searchParams.get('page')
  const where = searchParams.get('where')

  const result = await findOperation({
    collection,
    depth: isNumber(depth) ? Number(depth) : undefined,
    draft: searchParams.get('draft') === 'true',
    limit: isNumber(limit) ? Number(limit) : undefined,
    page: isNumber(page) ? Number(page) : undefined,
    req,
    sort: searchParams.get('sort'),
    where: where ? JSON.parse(where) : undefined,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
