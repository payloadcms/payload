import type { GeneratedTypes } from '../../index.js'
import type { Where } from '../../types/index.js'
import type { PreferenceRequest } from '../types.js'

async function findOne(
  args: PreferenceRequest,
): Promise<GeneratedTypes['collections']['_preference']> {
  const {
    key,
    req: { payload },
    req,
    user,
  } = args

  if (!user) return null

  const where: Where = {
    and: [
      { key: { equals: key } },
      { 'user.value': { equals: user.id } },
      { 'user.relationTo': { equals: user.collection } },
    ],
  }

  return await payload.db.findOne({
    collection: 'payload-preferences',
    req,
    where,
  })
}

export default findOne
