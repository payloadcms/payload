import type { Document, Payload, Where } from '../../types/index.js'
import type { PreferenceRequest } from '../types.js'

import { NotFound } from '../../errors/NotFound.js'
import { UnauthorizedError } from '../../errors/UnauthorizedError.js'
import { createLocalReq } from '../../utilities/createLocalReq.js'

export async function deleteOperation(
  payload: Payload,
  args: PreferenceRequest,
): Promise<Document> {
  const { key, req: reqFromArgs, user } = args

  const req =
    reqFromArgs ||
    (await createLocalReq(
      {
        user,
      },
      payload,
    ))

  if (!user) {
    throw new UnauthorizedError(req.t)
  }

  const where: Where = {
    and: [
      { key: { equals: key } },
      { 'user.value': { equals: user.id } },
      { 'user.relationTo': { equals: user.collection } },
    ],
  }

  const result = await payload.db.deleteOne({
    collection: 'payload-preferences',
    req,
    where,
  })

  if (result) {
    return result
  }

  throw new NotFound(req.t)
}
