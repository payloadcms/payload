import type { Payload } from 'payload'

import { seedDB } from '../__helpers/shared/clearAndSeed/seed.js'

export const seed = async (payload: Payload): Promise<void> => {
  await payload.create({
    collection: 'pages',
    data: { title: 'Seeded page' },
  } as never)

  const fileData = Buffer.from('Seeded media')

  await payload.create({
    collection: 'media',
    data: { title: 'Seeded media' },
    file: {
      name: 'seed.txt',
      data: fileData,
      mimetype: 'text/plain',
      size: fileData.length,
    },
  } as never)

  await payload.updateGlobal({
    slug: 'settings',
    data: { title: 'Seeded settings' },
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
