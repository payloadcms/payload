import type { Payload, QueryPreset } from 'payload'

import { devUser as devCredentials, regularUser as regularCredentials } from '../credentials.js'
import { executePromises } from '../helpers/executePromises.js'
import { seedDB } from '../helpers/seed.js'
import { collectionSlugs, pagesSlug, usersSlug } from './slugs.js'

type SeededQueryPreset = {
  relatedCollection: 'pages'
} & Omit<QueryPreset, 'id' | 'relatedCollection'>

export const seedData: {
  everyone: SeededQueryPreset
  onlyMe: SeededQueryPreset
} = {
  onlyMe: {
    relatedCollection: 'pages',
    isShared: false,
    title: 'Only Me',
    columns: [
      {
        accessor: 'text',
        active: true,
      },
    ],
    access: {
      delete: {
        constraint: 'onlyMe',
      },
      update: {
        constraint: 'onlyMe',
      },
      read: {
        constraint: 'onlyMe',
      },
    },
    where: {
      text: {
        equals: 'example page',
      },
    },
  },
  everyone: {
    relatedCollection: 'pages',
    isShared: true,
    title: 'Everyone',
    access: {
      delete: {
        constraint: 'everyone',
      },
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
    where: {
      text: {
        equals: 'example page',
      },
    },
  },
}

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
          collection: 'payload-query-presets',
          user: devUser,
          overrideAccess: false,
          data: {
            title: 'Specific Users',
            isShared: true,
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
          collection: 'payload-query-presets',
          user: devUser,
          overrideAccess: false,
          data: seedData.everyone,
        }),
      () =>
        _payload.create({
          collection: 'payload-query-presets',
          user: devUser,
          overrideAccess: false,
          data: seedData.onlyMe,
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
