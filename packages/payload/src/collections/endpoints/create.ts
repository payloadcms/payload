// @ts-strict-ignore
import { getTranslation } from '@payloadcms/translations'
import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { isNumber } from '../../utilities/isNumber.js'
import { sanitizePopulateParam } from '../../utilities/sanitizePopulateParam.js'
import { sanitizeSelectParam } from '../../utilities/sanitizeSelectParam.js'
import { createOperation } from '../operations/create.js'

export const createHandler: PayloadHandler = async (req) => {
  const collection = getRequestCollection(req)
  const { searchParams } = req
  const autosave = searchParams.get('autosave') === 'true'
  const draft = searchParams.get('draft') === 'true'
  const depth = searchParams.get('depth')

  const doc = await createOperation({
    autosave,
    collection,
    data: req.data,
    depth: isNumber(depth) ? depth : undefined,
    draft,
    populate: sanitizePopulateParam(req.query.populate),
    req,
    select: sanitizeSelectParam(req.query.select),
  })

  return Response.json(
    {
      doc,
      message: req.t('general:successfullyCreated', {
        label: getTranslation(collection.config.labels.singular, req.i18n),
      }),
    },
    {
      headers: headersWithCors({
        headers: new Headers(),
        req,
      }),
      status: httpStatus.CREATED,
    },
  )
}
