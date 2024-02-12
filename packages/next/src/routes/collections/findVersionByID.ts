import httpStatus from 'http-status'

import { findVersionByIDOperation } from 'payload/operations'
import { isNumber } from 'payload/utilities'
import { CollectionRouteHandlerWithID } from '../types'

export const findVersionByID: CollectionRouteHandlerWithID = async ({ req, collection, id }) => {
  const { searchParams } = req
  const depth = searchParams.get('depth')

  const result = await findVersionByIDOperation({
    id,
    collection,
    depth: isNumber(depth) ? Number(depth) : undefined,
    req,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
