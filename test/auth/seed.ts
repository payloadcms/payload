import type { Config } from 'payload'

import { devUser } from '../credentials.js'
import { apiKeysSlug, seededAPIKeyOne, seededAPIKeyTwo } from './shared.js'

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
      apiKey: seededAPIKeyOne,
      enableAPIKey: true,
    },
  })

  await payload.create({
    collection: apiKeysSlug,
    data: {
      apiKey: seededAPIKeyTwo,
      enableAPIKey: true,
    },
  })
}
