import httpStatus from 'http-status'
import { updateByIDOperation } from 'payload'
import { isNumber } from 'payload/shared'

import type { CollectionRouteHandlerWithID } from '../types.js'

import { headersWithCors } from '../../../utilities/headersWithCors.js'
import { sanitizeCollectionID } from '../utilities/sanitizeCollectionID.js'
import { sanitizeSelect } from '../utilities/sanitizeSelect.js'

export const updateByID: CollectionRouteHandlerWithID = async ({
  id: incomingID,
  collection,
  req,
}) => {
  const { searchParams } = req
  const depth = searchParams.get('depth')
  const autosave = searchParams.get('autosave') === 'true'
  const draft = searchParams.get('draft') === 'true'
  const overrideLock = searchParams.get('overrideLock')
  const publishSpecificLocale = req.query.publishSpecificLocale as string | undefined

  const id = sanitizeCollectionID({
    id: incomingID,
    collectionSlug: collection.config.slug,
    payload: req.payload,
  })

  const doc = await updateByIDOperation({
    id,
    autosave,
    collection,
    data: req.data,
    depth: isNumber(depth) ? Number(depth) : undefined,
    draft,
    overrideLock: Boolean(overrideLock === 'true'),
    publishSpecificLocale,
    req,
    select: sanitizeSelect(req.query.select),
  })

  let message = req.t('general:updatedSuccessfully')

  if (draft) {
    message = req.t('version:draftSavedSuccessfully')
  }
  if (autosave) {
    message = req.t('version:autosavedSuccessfully')
  }

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
