import type { Payload } from 'payload'

import { devUser } from '@tools/test-utils/shared'

export const seed = async (payload: Payload) => {
  await payload.create({
    collection: 'users',
    data: {
      email: devUser.email,
      password: devUser.password,
    },
  })
}
