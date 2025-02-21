import type { Payload } from 'payload'

import { devUser as devCredentials, regularUser as regularCredentials } from '../credentials.js'
import { executePromises } from '../helpers/executePromises.js'
import { seedDB } from '../helpers/seed.js'
import { collectionSlugs, pagesSlug, usersSlug } from './slugs.js'

export const seed = async (_payload: Payload) => {
  const [devUser] = await executePromises(
    [
      () =>
        _payload.create({
          collection: usersSlug,
          data: {
            email: devCredentials.email,
            password: devCredentials.password,
            name: 'Admin',
            roles: ['admin'],
          },
        }),
      () =>
        _payload.create({
          collection: usersSlug,
          data: {
            email: regularCredentials.email,
            password: regularCredentials.password,
            name: 'User',
            roles: ['user'],
          },
        }),
    ],
    false,
  )

  await executePromises(
    [
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
            title: 'Specific Users',
            where: {
              text: {
                equals: 'example page',
              },
            },
            access: {
              read: {
                constraint: 'specificUsers',
                users: [devUser?.id || ''],
              },
              update: {
                constraint: 'specificUsers',
                users: [devUser?.id || ''],
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
      () =>
        _payload.create({
          collection: 'payload-shared-filters',
          data: {
            title: 'Everyone',
            where: {
              text: {
                equals: 'example page',
              },
            },
            access: {
              update: {
                constraint: 'everyone',
              },
              read: {
                constraint: 'everyone',
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
      () =>
        _payload.create({
          collection: 'payload-shared-filters',
          data: {
            title: 'Only Me',
            where: {
              text: {
                equals: 'example page',
              },
            },
            access: {
              update: {
                constraint: 'onlyMe',
              },
              read: {
                constraint: 'onlyMe',
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
