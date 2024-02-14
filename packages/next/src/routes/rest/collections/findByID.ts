import httpStatus from 'http-status'

import { findByIDOperation } from 'payload/operations'
import { isNumber } from 'payload/utilities'
import { CollectionRouteHandlerWithID } from '../types'

export const findByID: CollectionRouteHandlerWithID = async ({ req, collection, id }) => {
  const { searchParams } = req
  const depth = searchParams.get('depth')

  const result = await findByIDOperation({
    id,
    collection,
    depth: isNumber(depth) ? Number(depth) : undefined,
    draft: searchParams.get('draft') === 'true',
    req,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
