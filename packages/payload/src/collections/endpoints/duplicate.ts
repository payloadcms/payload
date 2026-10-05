import { getTranslation } from '@payloadcms/translations'
import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { parseParams } from '../../utilities/parseParams/index.js'
import { parseDocumentVersion } from '../../versions/parseDocumentVersion.js'
import { duplicateOperation } from '../operations/duplicate.js'

export const duplicateHandler: PayloadHandler = async (req) => {
  const { id, collection } = getRequestCollectionWithID(req)

  const { depth, populate, select, selectedLocales } = parseParams(req.query)

  const doc = await duplicateOperation({
    id,
    collection,
    data: req.data,
    depth,
    populate,
    req,
    select,
    selectedLocales,
    version: parseDocumentVersion({ isCreate: true, params: req.query }),
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
