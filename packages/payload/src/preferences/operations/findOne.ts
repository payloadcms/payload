import type { GeneratedTypes } from '../../'
import type { Where } from '../../types'
import type { PreferenceRequest } from '../types'

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

  const { docs } = await payload.find({
    collection: 'payload-preferences',
    depth: 0,
    pagination: false,
    req,
    user,
    where,
  })

  if (docs.length === 0) return null

  return docs[0]
}

export default findOne
