import type { Config } from 'payload'

import { devUser } from '../../credentials.js'

export const seed: Config['onInit'] = async (payload) => {
  await payload.create({
    overrideAccess: true,
    collection: 'users',
    data: {
      email: devUser.email,
      password: devUser.password,
    },
  })

  // Seed some sample posts
  await payload.create({
    overrideAccess: true,
    collection: 'posts',
    data: {
      content: 'This is the content of the first post.',
      title: 'First Post',
    },
  })

  await payload.create({
    overrideAccess: true,
    collection: 'posts',
    data: {
      content: 'This is the content of the second post.',
      title: 'Second Post',
    },
  })

  await payload.create({
    overrideAccess: true,
    collection: 'posts',
    data: {
      content: 'This is the content of the third post.',
      title: 'Third Post',
    },
  })
}
