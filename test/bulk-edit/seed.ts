import type { Payload } from 'payload'

import { devUser } from '../credentials.js'
import { postsSlug } from './shared.js'

export const seed = async (payload: Payload) => {
  await payload.create({
    overrideAccess: true,
    collection: 'users',
    data: {
      email: devUser.email,
      password: devUser.password,
    },
  })

  await payload.create({
    overrideAccess: true,
    collection: postsSlug,
    data: {
      title: 'example post',
    },
  })
}
