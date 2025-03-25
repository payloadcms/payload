import type { Where } from '../../types/index.js'
import type { PreferenceUpdateRequest } from '../types.js'

import { UnauthorizedError } from '../../errors/UnauthorizedError.js'
import { preferencesCollectionSlug } from '../config.js'

export async function update(args: PreferenceUpdateRequest) {
  const {
    key,
    req: { payload },
    req,
    user,
    value,
  } = args

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

  const preference = {
    key,
    user: {
      relationTo: user.collection,
      value: user.id,
    },
    value,
  }

  return await payload.db.upsert({
    collection: preferencesCollectionSlug,
    data: preference,
    req,
    where,
  })
}
