import { getTranslation } from '@payloadcms/translations'
import httpStatus from 'http-status'
import { duplicateOperation } from 'payload/operations'
import { isNumber } from 'payload/utilities'

import type { CollectionRouteHandlerWithID } from '../types.js'

export const duplicate: CollectionRouteHandlerWithID = async ({ id, collection, req }) => {
  const { searchParams } = req
  const depth = searchParams.get('depth')
  // draft defaults to true, unless explicitly set requested as false to prevent the newly duplicated document from being published
  const draft = searchParams.get('draft') !== 'false'

  const doc = await duplicateOperation({
    id,
    collection,
    depth: isNumber(depth) ? Number(depth) : undefined,
    draft,
    req,
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
      status: httpStatus.OK,
    },
  )
}
