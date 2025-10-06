import type { Config } from 'payload'

import { v4 as uuid } from 'uuid'

import { devUser } from '../credentials.js'
import { apiKeysSlug } from './shared.js'

export const seed: Config['onInit'] = async (payload) => {
  await payload.create({
    collection: 'users',
    data: {
      custom: 'Hello, world!',
      email: devUser.email,
      password: devUser.password,
      roles: ['admin'],
    },
  })

  await payload.create({
    collection: apiKeysSlug,
    data: {
      apiKey: uuid(),
      enableAPIKey: true,
    },
  })

  await payload.create({
    collection: apiKeysSlug,
    data: {
      apiKey: uuid(),
      enableAPIKey: true,
    },
  })
}
