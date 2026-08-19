import type { Payload } from 'payload'

import { devUser, regularUser } from '../credentials.js'

export const seed = async (payload: Payload) => {
  await payload.create({
    collection: 'users',
    depth: 0,
    select: {},
    data: {
      email: devUser.email,
      password: devUser.password,
      name: 'Admin',
      roles: ['is_admin', 'is_user'],
    },
    overrideAccess: true,
  })

  await payload.create({
    collection: 'users',
    depth: 0,
    select: {},
    data: {
      email: regularUser.email,
      password: regularUser.password,
      name: 'Dev',
      roles: ['is_user'],
    },
    overrideAccess: true,
  })

  await payload.create({
    collection: 'pages',
    depth: 0,
    select: {},
    data: {
      title: 'Page',
    },
    overrideAccess: true,
  })

  await payload.create({
    collection: 'posts',
    depth: 0,
    select: {},
    data: {
      title: 'Post 1',
      _status: 'published',
    },
    overrideAccess: true,
  })

  await payload.create({
    collection: 'posts',
    depth: 0,
    select: {},
    data: {
      title: 'Post 2',
      _status: 'published',
    },
    overrideAccess: true,
  })
}
