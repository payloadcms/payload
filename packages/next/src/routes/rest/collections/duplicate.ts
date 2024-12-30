import { getTranslation } from '@payloadcms/translations'
import httpStatus from 'http-status'
import { duplicateOperation, sanitizePopulateParam, sanitizeSelectParam } from 'payload'
import { isNumber } from 'payload/shared'

import type { CollectionRouteHandlerWithID } from '../types.js'

import { headersWithCors } from '../../../utilities/headersWithCors.js'
import { sanitizeCollectionID } from '../utilities/sanitizeCollectionID.js'

export const duplicate: CollectionRouteHandlerWithID = async ({
  id: incomingID,
  collection,
  req,
}) => {
  const { searchParams } = req
  const depth = searchParams.get('depth')
  // draft defaults to true, unless explicitly set requested as false to prevent the newly duplicated document from being published
  const draft = searchParams.get('draft') !== 'false'

  const id = sanitizeCollectionID({
    id: incomingID,
    collectionSlug: collection.config.slug,
    payload: req.payload,
  })

  const doc = await duplicateOperation({
    id,
    collection,
    data: req.data,
    depth: isNumber(depth) ? Number(depth) : undefined,
    draft,
    populate: sanitizePopulateParam(req.query.populate),
    req,
    select: sanitizeSelectParam(req.query.select),
  })

  const message = req.t('general:successfullyDuplicated', {
    label: getTranslation(collection.config.labels.singular, req.i18n),
  })

  return Response.json(
    {
      doc,
      message,
    },
    {
      headers: headersWithCors({
        headers: new Headers(),
        req,
      }),
      status: httpStatus.OK,
    },
  )
}
