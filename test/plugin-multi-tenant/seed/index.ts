import type { Config } from 'payload'

import { devUser, regularUser } from '../../credentials.js'

export const seed: Config['onInit'] = async (payload) => {
  // create tenants
  const tenant1 = await payload.create({
    collection: 'tenants',
    data: {
      name: 'Blue Dog',
      slug: 'blue-dog',
      domain: 'bluedog.com',
    },
  })
  const tenant2 = await payload.create({
    collection: 'tenants',
    data: {
      name: 'Steel Cat',
      slug: 'steel-cat',
      domain: 'steelcat.com',
    },
  })

  // create posts
  await payload.create({
    collection: 'posts',
    data: {
      title: 'Blue Dog Post',
      tenant: tenant1.id,
    },
  })
  await payload.create({
    collection: 'posts',
    data: {
      title: 'Steel Cat Post',
      tenant: tenant2.id,
    },
  })

  // create users
  await payload.create({
    collection: 'users',
    data: {
      email: devUser.email,
      password: devUser.password,
      roles: ['admin'],
    },
  })

  await payload.create({
    collection: 'users',
    data: {
      email: regularUser.email,
      password: regularUser.password,
      roles: ['user'],
      tenants: [
        {
          tenant: tenant1.id,
        },
      ],
    },
  })
}
