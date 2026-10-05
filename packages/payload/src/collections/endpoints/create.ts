import { getTranslation } from '@payloadcms/translations'
import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { parseParams } from '../../utilities/parseParams/index.js'
import { parseDocumentVersion } from '../../versions/parseDocumentVersion.js'
import { createOperation } from '../operations/create.js'

export const createHandler: PayloadHandler = async (req) => {
  const collection = getRequestCollection(req)

  const { autosave, depth, populate, select } = parseParams(req.query)

  const version = parseDocumentVersion({ isCreate: true, params: req.query })

  const doc = await createOperation({
    autosave,
    collection,
    data: req.data!,
    depth,
    populate,
    req,
    select,
    version,
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
