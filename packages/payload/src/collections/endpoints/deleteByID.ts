import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { isNumber } from '../../utilities/isNumber.js'
import { sanitizePopulateParam } from '../../utilities/sanitizePopulateParam.js'
import { sanitizeSelectParam } from '../../utilities/sanitizeSelectParam.js'
import { deleteByIDOperation } from '../operations/deleteByID.js'

export const deleteByIDHandler: PayloadHandler = async (req) => {
  const { id, collection } = getRequestCollectionWithID(req)
  const { searchParams } = req
  const depth = searchParams.get('depth')
  const overrideLock = searchParams.get('overrideLock')

  const doc = await deleteByIDOperation({
    id,
    collection,
    depth: isNumber(depth) ? depth : undefined,
    overrideLock: Boolean(overrideLock === 'true'),
    populate: sanitizePopulateParam(req.query.populate),
    req,
    select: sanitizeSelectParam(req.query.select),
  })

  const headers = headersWithCors({
    headers: new Headers(),
    req,
  })

  if (!doc) {
    return Response.json(
      {
        message: req.t('general:notFound'),
      },
      {
        headers,
        status: httpStatus.NOT_FOUND,
      },
    )
  }

  return Response.json(
    {
      doc,
      message: req.t('general:deletedSuccessfully'),
    },
    {
      headers,
      status: httpStatus.OK,
    },
  )
}
