import type { Payload } from 'payload'

import { devUser, regularUser } from '../credentials.js'
import { executePromises } from '../helpers/executePromises.js'
import { seedDB } from '../helpers/seed.js'
import { collectionSlugs, pagesSlug, usersSlug } from './slugs.js'

export const seed = async (_payload: Payload) => {
  await executePromises(
    [
      () =>
        _payload.create({
          collection: usersSlug,
          data: {
            email: devUser.email,
            password: devUser.password,
            name: 'Admin',
            roles: ['is_admin', 'is_user'],
          },
        }),
      () =>
        _payload.create({
          collection: usersSlug,
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
          collection: 'payload-shared-filters',
          data: {
            title: 'Example Filter',
            where: {
              text: {
                equals: 'example page',
              },
            },
            columns: [
              {
                accessor: 'text',
                active: true,
              },
            ],
            relatedCollection: pagesSlug,
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
