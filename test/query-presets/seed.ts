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
  specificUsers: (args: { userID: string }) => SeededQueryPreset
} = {
  onlyMe: {
    relatedCollection: pagesSlug,
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
    relatedCollection: pagesSlug,
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
  specificUsers: ({ userID }: { userID: string }) => ({
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
        users: [userID],
      },
      update: {
        constraint: 'specificUsers',
        users: [userID],
      },
      delete: {
        constraint: 'specificUsers',
        users: [userID],
      },
    },
    columns: [
      {
        accessor: 'text',
        active: true,
      },
    ],
    relatedCollection: pagesSlug,
  }),
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
      () =>
        _payload.create({
          collection: usersSlug,
          data: {
            email: 'anonymous@email.com',
            password: regularCredentials.password,
            name: 'User',
            roles: ['anonymous'],
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
          data: seedData.specificUsers({ userID: devUser?.id || '' }),
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
