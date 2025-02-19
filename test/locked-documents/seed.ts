import type { Payload } from 'payload'

import { devUser, regularUser } from '../credentials.js'
import { executePromises } from '../helpers/executePromises.js'
import { seedDB } from '../helpers/seed.js'
import { collectionSlugs, pagesSlug, postsSlug } from './slugs.js'

export const seed = async (_payload: Payload) => {
  await executePromises(
    [
      () =>
        _payload.create({
          collection: 'users',
          data: {
            email: devUser.email,
            password: devUser.password,
            name: 'Admin',
            roles: ['is_admin', 'is_user'],
          },
        }),
      () =>
        _payload.create({
          collection: 'users',
          data: {
            email: regularUser.email,
            password: regularUser.password,
            name: 'Dev',
            roles: ['is_user'],
          },
        }),
      () =>
        _payload.create({
          collection: pagesSlug,
          data: {
            text: 'example page',
          },
        }),
      () =>
        _payload.create({
          collection: postsSlug,
          data: {
            text: 'example post',
          },
        }),
    ],
    false,
  )
}

export async function clearAndSeedEverything(_payload: Payload) {
  return await seedDB({
    _payload,
    collectionSlugs,
    seedFunction: seed,
    snapshotKey: 'adminTests',
  })
}
