import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { unpublishOperation } from '../operations/unpublish.js'

export const unpublishHandler: PayloadHandler = async (req) => {
  const { id, collection } = getRequestCollectionWithID(req)

  const result = await unpublishOperation({
    id,
    collection,
    req,
  })

  return Response.json(
    {
      message: req.t('version:unpublishedSuccessfully'),
      result,
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
