import type { Payload, Where } from '../../types/index.js'
import type { PreferenceUpdateRequest } from '../types.js'

import { UnauthorizedError } from '../../errors/UnauthorizedError.jss'
import { createLocalReq, type TypedCollection } from '../../index.js'

export async function update(
  payload: Payload,
  args: PreferenceUpdateRequest,
): Promise<TypedCollection['_preference']> {
  const { key, req: reqFromArgs, user, value } = args

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

  const collection = 'payload-preferences'

  const where: Where = {
    and: [
      { key: { equals: key } },
      { 'user.value': { equals: user.id } },
      { 'user.relationTo': { equals: user.collection } },
    ],
  }

  const preference = {
    key,
    user: {
      relationTo: user.collection,
      value: user.id,
    },
    value,
  }

  return await payload.db.upsert({
    collection,
    data: preference,
    req,
    where,
  })
}
