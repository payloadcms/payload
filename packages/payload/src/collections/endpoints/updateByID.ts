// @ts-strict-ignore
import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { isNumber } from '../../utilities/isNumber.js'
import { sanitizePopulateParam } from '../../utilities/sanitizePopulateParam.js'
import { sanitizeSelectParam } from '../../utilities/sanitizeSelectParam.js'
import { updateByIDOperation } from '../operations/updateByID.js'

export const updateByIDHandler: PayloadHandler = async (req) => {
  const { id, collection } = getRequestCollectionWithID(req)
  const { searchParams } = req
  const depth = searchParams.get('depth')
  const autosave = searchParams.get('autosave') === 'true'
  const draft = searchParams.get('draft') === 'true'
  const overrideLock = searchParams.get('overrideLock')
  const publishSpecificLocale = req.query.publishSpecificLocale as string | undefined

  const doc = await updateByIDOperation({
    id,
    autosave,
    collection,
    data: req.data,
    depth: isNumber(depth) ? Number(depth) : undefined,
    draft,
    overrideLock: Boolean(overrideLock === 'true'),
    populate: sanitizePopulateParam(req.query.populate),
    publishSpecificLocale,
    req,
    select: sanitizeSelectParam(req.query.select),
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
