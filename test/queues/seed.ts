import type { Payload } from 'payload'

import { seedDB } from '../__helpers/shared/clearAndSeed/seed.js'
import { devUser } from '../credentials.js'

export const seed = async (_payload: Payload) => {
  await _payload.create({
    collection: 'users',
    data: {
      email: devUser.email,
      password: devUser.password,
    },
    overrideAccess: true,
  })
}

export async function clearAndSeedEverything(_payload: Payload) {
  return await seedDB({
    _payload,
    collectionSlugs: [
      ..._payload.config.collections.map((collection) => collection.slug),
      'payload-jobs',
    ],
    seedFunction: seed,
    snapshotKey: 'queuesTest',
  })
}
