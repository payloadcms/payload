import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { devUser } from '../credentials.js'
import { seedDB } from '../helpers/seed.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

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
    collectionSlugs: _payload.config.collections.map((collection) => collection.slug),
    seedFunction: seed,
    snapshotKey: 'fieldsTest',
    uploadsDir: path.resolve(dirname, './collections/Upload/uploads'),
  })
}
