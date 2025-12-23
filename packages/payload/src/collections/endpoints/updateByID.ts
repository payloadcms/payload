import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { parseParams } from '../../utilities/parseParams/index.js'
import { updateByIDOperation } from '../operations/updateByID.js'

export const updateByIDHandler: PayloadHandler = async (req) => {
  const { id, collection } = getRequestCollectionWithID(req)

  const {
    autosave,
    depth,
    draft,
    overrideLock,
    populate,
    publishAllLocales,
    publishSpecificLocale,
    select,
    trash,
    unpublishAllLocales,
  } = parseParams(req.query)

  const doc = await updateByIDOperation({
    id,
    autosave,
    collection,
    data: req.data!,
    depth,
    draft,
    overrideLock: overrideLock ?? false,
    populate,
    publishAllLocales,
    publishSpecificLocale,
    req,
    select,
    trash,
    unpublishAllLocales,
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
