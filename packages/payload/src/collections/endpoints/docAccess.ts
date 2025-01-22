import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js'
import { docAccessOperation } from '../operations/docAccess.js'

export const docAccessHandler: PayloadHandler = async (req) => {
  const { id, collection } = getRequestCollectionWithID(req, { optionalID: true })
  const result = await docAccessOperation({
    id,
    collection,
    req,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
