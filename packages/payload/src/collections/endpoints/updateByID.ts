import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { parseParams } from '../../utilities/parseParams/index.js'
import { parseDocumentVersion } from '../../versions/parseDocumentVersion.js'
import { updateByIDOperation } from '../operations/updateByID.js'

export const updateByIDHandler: PayloadHandler = async (req) => {
  const { id, collection } = getRequestCollectionWithID(req)

  const { autosave, depth, overrideLock, populate, select, trash } = parseParams(req.query)

  const version = parseDocumentVersion({ params: req.query })

  const doc = await updateByIDOperation({
    id,
    autosave,
    collection,
    data: req.data!,
    depth,
    overrideLock: overrideLock ?? false,
    populate,
    req,
    select,
    trash,
    version,
  })

  let message = req.t('general:updatedSuccessfully')

  if (version === 'draft' && req.data?._status !== 'published') {
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
