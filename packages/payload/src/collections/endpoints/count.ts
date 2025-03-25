import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'
import type { Where } from '../../types/index.js'

import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { countOperation } from '../operations/count.js'

export const countHandler: PayloadHandler = async (req) => {
  const collection = getRequestCollection(req)
  const { where } = req.query as {
    where?: Where
  }

  const result = await countOperation({
    collection,
    req,
    where,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
