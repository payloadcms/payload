import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { parseParams } from '../../utilities/parseParams/index.js'
import { countOperation } from '../operations/count.js'

export const countHandler: PayloadHandler = async (req) => {
  const collection = getRequestCollection(req)

  const { trash, where } = parseParams(req.query)

  const result = await countOperation({
    collection,
    req,
    trash,
    where,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
