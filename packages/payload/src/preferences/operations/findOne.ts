import type { Payload, Where } from '../../types/index.js'
import type { PreferenceRequest } from '../types.js'

import { createLocalReq, type TypedCollection } from '../../index.js'

export async function findOne(
  payload: Payload,
  args: PreferenceRequest,
): Promise<TypedCollection['_preference']> {
  const { key, req: reqFromArgs, user } = args

  if (!user) {
    return null
  }

  const req =
    reqFromArgs ||
    (await createLocalReq(
      {
        user,
      },
      payload,
    ))

  const where: Where = {
    and: [
      { key: { equals: key } },
      { 'user.value': { equals: user.id } },
      { 'user.relationTo': { equals: user.collection } },
    ],
  }

  const { docs } = await payload.db.find({
    collection: 'payload-preferences',
    limit: 1,
    pagination: false,
    req,
    sort: '-updatedAt',
    where,
  })

  return docs?.[0] || null
}
