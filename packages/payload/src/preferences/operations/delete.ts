import type { Document, Where } from '../../types/index.js'
import type { PreferenceRequest } from '../types.js'

import { NotFound } from '../../errors/NotFound.js'
import { UnauthorizedError } from '../../errors/UnauthorizedError.js'
import { preferencesCollectionSlug } from '../config.js'

export async function deleteOperation(args: PreferenceRequest): Promise<Document> {
  const {
    key,
    req: { payload },
    req,
    user,
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

  const result = await payload.db.deleteOne({
    collection: preferencesCollectionSlug,
    req,
    where,
  })

  if (result) {
    return result
  }
  throw new NotFound(req.t)
}
