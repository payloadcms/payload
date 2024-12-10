import type { JoinQuery } from 'payload'

import httpStatus from 'http-status'
import {
  findByIDOperation,
  sanitizeJoinParams,
  sanitizePopulateParam,
  sanitizeSelectParam,
} from 'payload'
import { isNumber } from 'payload/shared'

import type { CollectionRouteHandlerWithID } from '../types.js'

import { headersWithCors } from '../../../utilities/headersWithCors.js'
import { sanitizeCollectionID } from '../utilities/sanitizeCollectionID.js'

export const findByID: CollectionRouteHandlerWithID = async ({
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

  const result = await findByIDOperation({
    id,
    collection,
    depth: isNumber(depth) ? Number(depth) : undefined,
    draft: searchParams.get('draft') === 'true',
    joins: sanitizeJoinParams(req.query.joins as JoinQuery),
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
