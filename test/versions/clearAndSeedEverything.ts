import { type Payload } from 'payload'

import { seedDB } from '../helpers/seed.js'
import { seed } from './seed.js'
import { collectionSlugs } from './slugs.js'

export async function clearAndSeedEverything(_payload: Payload, parallel: boolean = false) {
  return await seedDB({
    snapshotKey: 'versionsTest',
    collectionSlugs,
    _payload,
    seedFunction: async (_payload) => {
      await seed(_payload, parallel)
    },
  })
}
