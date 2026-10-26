import type { Config } from 'payload'

import { devUser } from '../../credentials.js'

export const seed: Config['onInit'] = async (payload) => {
  await payload.create({
    collection: 'users',
    data: {
      email: devUser.email,
      password: devUser.password,
    },
  })

  await payload.create({
    collection: 'posts',
    data: {
      content: 'This is the content of the first post.',
      title: 'First Post',
    },
  })
}
