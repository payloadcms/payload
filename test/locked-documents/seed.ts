import type { Payload } from 'payload'

import { executePromises } from '../__helpers/shared/executePromises.js'
import { devUser, regularUser } from '../credentials.js'
import { pagesSlug, postsSlug, simpleSlug, simpleWithVersionsSlug } from './slugs.js'

export const seed = async (_payload: Payload) => {
  await executePromises(
    [
      () =>
        _payload.create({
          collection: 'users',
          data: {
            name: 'Admin',
            email: devUser.email,
            password: devUser.password,
            roles: ['is_admin', 'is_user'],
          },
          overrideAccess: true,
        }),
      () =>
        _payload.create({
          collection: 'users',
          data: {
            name: 'Dev',
            email: regularUser.email,
            password: regularUser.password,
            roles: ['is_user'],
          },
          overrideAccess: true,
        }),
      () =>
        _payload.create({
          collection: pagesSlug,
          data: {
            text: 'example page',
          },
          overrideAccess: true,
        }),
      () =>
        _payload.create({
          collection: postsSlug,
          data: {
            text: 'example post',
          },
          overrideAccess: true,
        }),
      () =>
        _payload.create({
          collection: simpleSlug,
          data: {
            fieldA: 'Initial value A',
            fieldB: 'Initial value B',
          },
          overrideAccess: true,
        }),
      () =>
        _payload.create({
          collection: simpleWithVersionsSlug,
          data: {
            fieldA: 'Initial value A',
            fieldB: 'Initial value B',
          },
          overrideAccess: true,
        }),
    ],
    false,
  )
}
