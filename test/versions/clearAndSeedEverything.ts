import path from 'path'
import { type Payload } from 'payload'
import { fileURLToPath } from 'url'

import { seedDB } from '../helpers/seed.js'
import { seed } from './seed.js'
import { collectionSlugs } from './slugs.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export async function clearAndSeedEverything(_payload: Payload, parallel: boolean = false) {
  return await seedDB({
    snapshotKey: 'versionsTest',
    collectionSlugs,
    _payload,
    uploadsDir: path.resolve(dirname, './collections/uploads'),
    seedFunction: async (_payload) => {
      await seed(_payload, parallel)
    },
  })
}
