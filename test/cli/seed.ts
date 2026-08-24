import type { Payload } from 'payload'

import { seedDB } from '../__helpers/shared/clearAndSeed/seed.js'

export const seed = async (payload: Payload): Promise<void> => {
  await payload.create({
    collection: 'pages',
    data: { title: 'Seeded page' },
  } as never)
}

export const clearAndSeedEverything = async (payload: Payload): Promise<void> => {
  await seedDB({
    _payload: payload,
    collectionSlugs: payload.config.collections.map(({ slug }) => slug),
    seedFunction: seed,
    snapshotKey: 'cli',
  })
}
