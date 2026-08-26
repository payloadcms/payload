import { getTranslation } from '@payloadcms/translations'
import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import {
  createActionValues,
  parseEnumParam,
  parseParams,
} from '../../utilities/parseParams/index.js'
import { createOperation } from '../operations/create.js'

export const createHandler: PayloadHandler = async (req) => {
  const collection = getRequestCollection(req)

  const {
    action: requestedAction,
    autosave,
    depth,
    populate,
    publishAllLocales,
    select,
  } = parseParams(req.query)
  const action = parseEnumParam({
    allowed: createActionValues,
    param: 'action',
    value: requestedAction,
  })

  const doc = await createOperation({
    action,
    autosave,
    collection,
    data: req.data!,
    depth,
    populate,
    publishAllLocales,
    req,
    select,
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
