import type { Payload, QueryPreset } from 'payload'

import { executePromises } from '../__helpers/shared/executePromises.js'
import { devUser as devCredentials, regularUser as regularCredentials } from '../credentials.js'
import { pagesSlug, postsSlug, usersSlug } from './slugs.js'

type SeededQueryPreset = {
  relatedCollection: 'pages'
} & Omit<QueryPreset, 'id' | 'relatedCollection'>

export const seedData: {
  everyone: () => SeededQueryPreset
  onlyMe: () => SeededQueryPreset
  specificUsers: (args: { adminUserID: string }) => SeededQueryPreset
} = {
  everyone: () => ({
    access: {
      delete: {
        constraint: 'everyone',
      },
      read: {
        constraint: 'everyone',
      },
      update: {
        constraint: 'everyone',
      },
    },
    columns: [
      {
        accessor: 'text',
        active: true,
      },
    ],
    isShared: true,
    relatedCollection: pagesSlug,
    title: 'Everyone',
    where: {
      text: {
        equals: 'example page',
      },
    },
  }),
  onlyMe: () => ({
    access: {
      delete: {
        constraint: 'onlyMe',
      },
      read: {
        constraint: 'onlyMe',
      },
      update: {
        constraint: 'onlyMe',
      },
    },
    columns: [
      {
        accessor: 'text',
        active: true,
      },
    ],
    isShared: false,
    relatedCollection: pagesSlug,
    title: 'Only Me',
    where: {
      text: {
        equals: 'example page',
      },
    },
  }),
  specificUsers: ({ adminUserID }: { adminUserID: string }) => ({
    access: {
      delete: {
        constraint: 'specificUsers',
        users: [adminUserID],
      },
      read: {
        constraint: 'specificUsers',
        users: [adminUserID],
      },
      update: {
        constraint: 'specificUsers',
        users: [adminUserID],
      },
    },
    columns: [
      {
        accessor: 'text',
        active: true,
      },
    ],
    isShared: true,
    relatedCollection: pagesSlug,
    title: 'Specific Users',
    where: {
      text: {
        equals: 'example page',
      },
    },
  }),
}

export const seed = async (_payload: Payload) => {
  const [adminUser] = await executePromises(
    [
      () =>
        _payload.create({
          collection: usersSlug,
          data: {
            name: 'Admin',
            email: devCredentials.email,
            password: devCredentials.password,
            roles: ['admin'],
          },
          overrideAccess: true,
        }),
      () =>
        _payload.create({
          collection: usersSlug,
          data: {
            name: 'Editor',
            email: regularCredentials.email,
            password: regularCredentials.password,
            roles: ['editor'],
          },
          overrideAccess: true,
        }),
      () =>
        _payload.create({
          collection: usersSlug,
          data: {
            name: 'Public User',
            email: 'public@email.com',
            password: regularCredentials.password,
            roles: ['user'],
          },
          overrideAccess: true,
        }),
    ],
    false,
  )

  // Create posts first, then pages with relationships
  const [post1, post2] = await executePromises(
    [
      () =>
        _payload.create({
          collection: postsSlug,
          data: {
            text: 'Test Post 1',
          },
          overrideAccess: true,
        }),
      () =>
        _payload.create({
          collection: postsSlug,
          data: {
            text: 'Test Post 2',
          },
          overrideAccess: true,
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
            postsRelationship: [post1.id, post2.id],
            text: 'example page',
          },
          overrideAccess: true,
        }),
      () =>
        _payload.create({
          collection: 'payload-query-presets',
          data: seedData.specificUsers({
            adminUserID: adminUser?.id || '',
          }),
          overrideAccess: false,
          user: adminUser,
        }),
      () =>
        _payload.create({
          collection: 'payload-query-presets',
          data: seedData.everyone(),
          overrideAccess: false,
          user: adminUser,
        }),
      () =>
        _payload.create({
          collection: 'payload-query-presets',
          data: seedData.onlyMe(),
          overrideAccess: false,
          user: adminUser,
        }),
      () =>
        _payload.create({
          collection: 'payload-query-presets',
          data: {
            access: {
              read: {
                constraint: 'noone',
              },
            },
            relatedCollection: 'pages',
            title: 'Noone',
          },
          overrideAccess: true,
          user: adminUser,
        }),
      () =>
        _payload.create({
          collection: 'default-columns',
          data: {
            defaultColumnField: 'defaultColumnField',
            field1: 'field1',
            field2: 'field2',
          },
          overrideAccess: true,
        }),
      // Create basic query preset for default columns
      () =>
        _payload.create({
          collection: 'payload-query-presets',
          data: {
            access: {
              read: {
                constraint: 'everyone',
              },
            },
            relatedCollection: 'default-columns',
            title: 'Default Columns',
            where: {
              field1: {
                exists: true,
              },
            },
          },
          overrideAccess: false,
          user: adminUser,
        }),
    ],
    false,
  )
}
