import { getTranslation } from '@payloadcms/translations'
import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { isNumber } from '../../utilities/isNumber.js'
import { sanitizePopulateParam } from '../../utilities/sanitizePopulateParam.js'
import { sanitizeSelectParam } from '../../utilities/sanitizeSelectParam.js'
import { duplicateOperation } from '../operations/duplicate.js'

export const duplicateHandler: PayloadHandler = async (req) => {
  const { id, collection } = getRequestCollectionWithID(req)
  const { searchParams } = req
  const depth = searchParams.get('depth')
  // draft defaults to true, unless explicitly set requested as false to prevent the newly duplicated document from being published
  const draft = searchParams.get('draft') !== 'false'

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
