import type { Payload } from 'payload'

import { devUser } from '../credentials.js'
import { seedDB } from '../helpers/seed.js'

export const seed = async (_payload: Payload) => {
  await _payload.create({
    collection: 'users',
    data: {
      email: devUser.email,
      password: devUser.password,
    },
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
  })
}
