import type { Payload, QueryPreset } from 'payload'

import { devUser as devCredentials, regularUser as regularCredentials } from '../credentials.js'
import { executePromises } from '../helpers/shared/executePromises.js'
import { pagesSlug, postsSlug, usersSlug } from './slugs.js'

type SeededQueryPreset = {
  relatedCollection: 'pages'
} & Omit<QueryPreset, 'id' | 'relatedCollection'>

export const seedData: {
  everyone: () => SeededQueryPreset
  onlyMe: () => SeededQueryPreset
  specificUsers: (args: { adminUserID: string }) => SeededQueryPreset
} = {
  onlyMe: () => ({
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
  }),
  everyone: () => ({
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
  }),
  specificUsers: ({ adminUserID }: { adminUserID: string }) => ({
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
        users: [adminUserID],
      },
      update: {
        constraint: 'specificUsers',
        users: [adminUserID],
      },
      delete: {
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
    relatedCollection: pagesSlug,
  }),
}

export const seed = async (_payload: Payload) => {
  const [adminUser] = await executePromises(
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
            name: 'Editor',
            roles: ['editor'],
          },
        }),
      () =>
        _payload.create({
          collection: usersSlug,
          data: {
            email: 'public@email.com',
            password: regularCredentials.password,
            name: 'Public User',
            roles: ['user'],
          },
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
        }),
      () =>
        _payload.create({
          collection: postsSlug,
          data: {
            text: 'Test Post 2',
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
            postsRelationship: [post1.id, post2.id],
          },
        }),
      () =>
        _payload.create({
          collection: 'payload-query-presets',
          user: adminUser,
          overrideAccess: false,
          data: seedData.specificUsers({
            adminUserID: adminUser?.id || '',
          }),
        }),
      () =>
        _payload.create({
          collection: 'payload-query-presets',
          user: adminUser,
          overrideAccess: false,
          data: seedData.everyone(),
        }),
      () =>
        _payload.create({
          collection: 'payload-query-presets',
          user: adminUser,
          overrideAccess: false,
          data: seedData.onlyMe(),
        }),
      () =>
        _payload.create({
          collection: 'payload-query-presets',
          user: adminUser,
          data: {
            relatedCollection: 'pages',
            title: 'Noone',
            access: {
              read: {
                constraint: 'noone',
              },
            },
          },
        }),
      () =>
        _payload.create({
          collection: 'default-columns',
          data: {
            field1: 'field1',
            field2: 'field2',
            defaultColumnField: 'defaultColumnField',
          },
        }),
      // Create basic query preset for default columns
      () =>
        _payload.create({
          collection: 'payload-query-presets',
          user: adminUser,
          overrideAccess: false,
          data: {
            relatedCollection: 'default-columns',
            title: 'Default Columns',
            where: {
              field1: {
                exists: true,
              },
            },
            access: {
              read: {
                constraint: 'everyone',
              },
            },
          },
        }),
    ],
    false,
  )
}
