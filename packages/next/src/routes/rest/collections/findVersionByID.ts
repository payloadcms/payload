import httpStatus from 'http-status'
import { findVersionByIDOperation, sanitizePopulateParam, sanitizeSelectParam } from 'payload'
import { isNumber } from 'payload/shared'

import type { CollectionRouteHandlerWithID } from '../types.js'

import { headersWithCors } from '../../../utilities/headersWithCors.js'
import { sanitizeCollectionID } from '../utilities/sanitizeCollectionID.js'

export const findVersionByID: CollectionRouteHandlerWithID = async ({
  id: incomingID,
  collection,
  req,
}) => {
  const { searchParams } = req
  const depth = searchParams.get('depth')

  const id = sanitizeCollectionID({
    id: incomingID,
    collectionSlug: collection.config.slug,
    payload: req.payload,
  })

  const result = await findVersionByIDOperation({
    id,
    collection,
    depth: isNumber(depth) ? Number(depth) : undefined,
    populate: sanitizePopulateParam(req.query.populate),
    req,
    select: sanitizeSelectParam(req.query.select),
  })

  return Response.json(result, {
    headers: headersWithCors({
      headers: new Headers(),
      req,
    }),
    status: httpStatus.OK,
  })
}
