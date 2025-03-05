// @ts-strict-ignore
import type { TypedCollection } from '../../index.js'
import type { Where } from '../../types/index.js'
import type { PreferenceRequest } from '../types.js'

import { preferencesCollectionSlug } from '../config.js'

export async function findOne(args: PreferenceRequest): Promise<TypedCollection['_preference']> {
  const {
    key,
    req: { payload },
    req,
    user,
  } = args

  if (!user) {
    return null
  }

  const where: Where = {
    and: [
      { key: { equals: key } },
      { 'user.value': { equals: user.id } },
      { 'user.relationTo': { equals: user.collection } },
    ],
  }

  const { docs } = await payload.db.find({
    collection: preferencesCollectionSlug,
    limit: 1,
    pagination: false,
    req,
    sort: '-updatedAt',
    where,
  })

  return docs?.[0] || null
}
