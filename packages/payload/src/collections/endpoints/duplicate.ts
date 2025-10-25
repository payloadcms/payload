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
  const { depth, draft, populate, select, selectedLocales } = req.query as {
    depth?: string
    draft?: string
    populate?: Record<string, unknown>
    select?: Record<string, unknown>
    selectedLocales?: string[]
  }

  const doc = await duplicateOperation({
    id,
    collection,
    data: req.data,
    depth: isNumber(depth) ? Number(depth) : undefined,
    draft: draft === 'true',
    populate: sanitizePopulateParam(populate),
    req,
    select: sanitizeSelectParam(select),
    selectedLocales,
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
