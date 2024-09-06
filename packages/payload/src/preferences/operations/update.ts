import type { Where } from '../../types/index.js'
import type { PreferenceUpdateRequest } from '../types.js'

import { UnauthorizedError } from '../../errors/UnathorizedError.js'

export function update(args: PreferenceUpdateRequest) {
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

  try {
    // try/catch because we attempt to update without first reading to check if it exists first to save on db calls
    void payload.db.updateOne({
      collection,
      data: preference,
      req,
      where,
    })
  } catch (err: unknown) {
    void payload.db.create({
      collection,
      data: preference,
      req,
    })
  }

  return preference
}
