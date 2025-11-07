import type { Payload } from 'payload'

import { devUser } from '../credentials.js'
import { executePromises } from '../helpers/executePromises.js'
import { postsSlug } from './shared.js'

export const seed = async (_payload: Payload) => {
  await executePromises(
    [
      () =>
        _payload.create({
          collection: 'users',
          data: {
            email: devUser.email,
            password: devUser.password,
          },
          depth: 0,
          overrideAccess: true,
        }),
      () =>
        _payload.create({
          collection: postsSlug,
          data: {
            title: 'Hello, world!',
          },
          depth: 0,
          overrideAccess: true,
        }),
    ],
    false,
  )
}
