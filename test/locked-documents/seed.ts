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
            email: devUser.email,
            password: devUser.password,
            name: 'Admin',
            roles: ['is_admin', 'is_user'],
          },
        }),
      () =>
        _payload.create({
          collection: 'users',
          data: {
            email: regularUser.email,
            password: regularUser.password,
            name: 'Dev',
            roles: ['is_user'],
          },
        }),
      () =>
        _payload.create({
          collection: pagesSlug,
          data: {
            text: 'example page',
          },
        }),
      () =>
        _payload.create({
          collection: postsSlug,
          data: {
            text: 'example post',
          },
        }),
      () =>
        _payload.create({
          collection: simpleSlug,
          data: {
            fieldA: 'Initial value A',
            fieldB: 'Initial value B',
          },
        }),
      () =>
        _payload.create({
          collection: simpleWithVersionsSlug,
          data: {
            fieldA: 'Initial value A',
            fieldB: 'Initial value B',
          },
        }),
    ],
    false,
  )
}
