import type { Payload } from 'payload'

import { devUser } from '@tools/test-utils/shared'
import { postsSlug } from './shared.js'

export const seed = async (payload: Payload) => {
  await payload.create({
    collection: 'users',
    data: {
      email: devUser.email,
      password: devUser.password,
    },
  })

  await payload.create({
    collection: postsSlug,
    data: {
      title: 'example post',
    },
  })
}
