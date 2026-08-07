import type { Config } from 'payload'

import { v4 as uuid } from 'uuid'

import { devUser } from '../credentials.js'
import { apiKeysSlug } from './shared.js'

export const seed: Config['onInit'] = async (payload) => {
  await payload.create({
    overrideAccess: true,
    collection: 'users',
    data: {
      custom: 'Hello, world!',
      email: devUser.email,
      password: devUser.password,
      roles: ['admin'],
    },
  })

  await payload.create({
    overrideAccess: true,
    collection: apiKeysSlug,
    data: {
      apiKey: uuid(),
      enableAPIKey: true,
    },
  })

  await payload.create({
    overrideAccess: true,
    collection: apiKeysSlug,
    data: {
      apiKey: uuid(),
      enableAPIKey: true,
    },
  })
}
