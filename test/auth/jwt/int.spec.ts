import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuid } from 'uuid'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../../__helpers/shared/initPayloadInt.js'
import { devUser } from '../../credentials.js'
import {
  jwtUsersSlug,
  restrictedJWTUsersSlug,
  restrictedRelationshipsSlug,
  slug,
} from '../shared.js'

let payload: Payload

const { password } = devUser
const dirname = path.dirname(fileURLToPath(import.meta.url))

describe('JWT authenticated user access', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname, 'auth/jwt', undefined, '../config.ts'))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  const createdJWTUserIDs: Array<number | string> = []
  const createdRestrictedJWTUserIDs: Array<number | string> = []
  const createdRestrictedRelationshipIDs: Array<number | string> = []
  const createdUserIDs: Array<number | string> = []

  afterEach(async () => {
    for (const id of createdJWTUserIDs) {
      await payload.delete({ id, collection: jwtUsersSlug })
    }

    for (const id of createdRestrictedJWTUserIDs) {
      await payload.delete({ id, collection: restrictedJWTUsersSlug })
    }

    for (const id of createdUserIDs) {
      await payload.delete({ id, collection: slug })
    }

    for (const id of createdRestrictedRelationshipIDs) {
      await payload.delete({ id, collection: restrictedRelationshipsSlug })
    }

    createdJWTUserIDs.length = 0
    createdRestrictedJWTUserIDs.length = 0
    createdRestrictedRelationshipIDs.length = 0
    createdUserIDs.length = 0
  })

  it('should apply field access to JWT-authenticated relationships', async () => {
    const peer = await payload.create({
      collection: restrictedRelationshipsSlug,
      data: {
        privateField: 'private value',
        publicField: 'public value',
      },
    })

    createdRestrictedRelationshipIDs.push(peer.id)

    const email = `jwt-user-${uuid()}@example.com`
    const user = await payload.create({
      collection: jwtUsersSlug,
      data: {
        email,
        password,
        peer: peer.id,
      },
    })

    createdJWTUserIDs.push(user.id)

    const { token } = await payload.login({
      collection: jwtUsersSlug,
      data: { email, password },
    })
    const authenticated = await payload.auth({
      headers: new Headers({ Authorization: `JWT ${token}` }),
    })
    const authenticatedUser = authenticated.user as {
      peer?:
        | {
            id: number | string
            privateField?: string
            publicField?: string
          }
        | number
    } & typeof authenticated.user

    expect(authenticatedUser?.id).toBe(user.id)
    expect(authenticatedUser?.peer).toMatchObject({
      id: peer.id,
      publicField: 'public value',
    })
    expect(authenticatedUser?.peer).not.toHaveProperty('privateField')
  })

  it('should apply query constraints to JWT-authenticated relationships', async () => {
    const peer = await payload.create({
      collection: restrictedRelationshipsSlug,
      data: {
        isPublic: false,
        privateField: 'restricted value',
        publicField: 'restricted relationship',
      },
    })

    createdRestrictedRelationshipIDs.push(peer.id)

    const email = `jwt-query-access-${uuid()}@example.com`
    const user = await payload.create({
      collection: jwtUsersSlug,
      data: {
        email,
        password,
        peer: peer.id,
      },
    })

    createdJWTUserIDs.push(user.id)

    const { token } = await payload.login({
      collection: jwtUsersSlug,
      data: { email, password },
    })
    const authenticated = await payload.auth({
      headers: new Headers({ Authorization: `JWT ${token}` }),
    })
    const authenticatedUser = authenticated.user as {
      peer?: { id: number | string; publicField?: string } | number | string
    } & typeof authenticated.user

    expect(authenticatedUser?.id).toBe(user.id)
    expect(authenticatedUser?.peer).toBe(peer.id)
    expect(JSON.stringify(authenticatedUser)).not.toContain('restricted relationship')
  })

  it('should omit unreadable fields from JWT-authenticated users', async () => {
    expect(payload.collections[slug].config.auth.depth).toBe(0)

    const email = `jwt-field-access-${uuid()}@example.com`
    const user = await payload.create({
      collection: slug,
      data: {
        adminOnlyField: 'private value',
        email,
        password,
        roles: ['editor'],
      },
    })

    createdUserIDs.push(user.id)

    const loginResult = await payload.login({
      collection: slug,
      data: { email, password },
      overrideAccess: false,
    })

    expect(loginResult.user).not.toHaveProperty('adminOnlyField')

    const authenticated = await payload.auth({
      headers: new Headers({ Authorization: `JWT ${loginResult.token}` }),
    })

    expect(authenticated.user?.id).toBe(user.id)
    expect(authenticated.user).not.toHaveProperty('adminOnlyField')
  })

  it('should return a field-filtered user without collection read access', async () => {
    const email = `restricted-jwt-user-${uuid()}@example.com`
    const user = await payload.create({
      collection: restrictedJWTUsersSlug,
      data: {
        email,
        password,
        privateField: 'private value',
      },
    })

    createdRestrictedJWTUserIDs.push(user.id)

    const { token } = await payload.login({
      collection: restrictedJWTUsersSlug,
      data: { email, password },
    })
    const authenticated = await payload.auth({
      headers: new Headers({ Authorization: `JWT ${token}` }),
    })

    expect(authenticated.user?.id).toBe(user.id)
    expect(authenticated.user).not.toHaveProperty('privateField')
  })
})
