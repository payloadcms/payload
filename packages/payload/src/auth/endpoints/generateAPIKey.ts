import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { APIError } from '../../errors/index.js'
import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { generateAPIKeyOperation } from '../operations/generateAPIKey.js'

export const generateAPIKeyHandler: PayloadHandler = async (req) => {
  const { id, collection } = getRequestCollectionWithID(req)

  if (!collection.config.auth?.useAPIKey) {
    throw new APIError('This collection does not use API keys.', httpStatus.NOT_FOUND)
  }

  const doc = await generateAPIKeyOperation({ id, collection, req, requestData: req.data ?? {} })

  return Response.json(doc, {
    headers: headersWithCors({
      headers: new Headers(),
      req,
    }),
    status: httpStatus.OK,
  })
}
