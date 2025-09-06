import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'
import type { Where } from '../../types/index.js'

import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { countOperation } from '../operations/count.js'

export const countHandler: PayloadHandler = async (req) => {
  const collection = getRequestCollection(req)
  const { trash, where } = req.query as {
    trash?: string
    where?: Where
  }

  const result = await countOperation({
    collection,
    req,
    trash: trash === 'true',
    where,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
