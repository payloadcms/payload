import type { Payload } from 'payload'

import path from 'path'
import { createPayloadRequest } from 'payload'
import { fileURLToPath } from 'url'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../../__helpers/shared/initPayloadInt.js'
import { apiKeysSlug, restrictedRelationshipsSlug } from './shared.js'

let payload: Payload
let restClient: NextRESTClient

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('API key authentication', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname, 'auth/api-key'))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('should return a user with read access from API key authentication', async () => {
    const restrictedRelationship = await payload.create({
      collection: restrictedRelationshipsSlug as any,
      data: {
        privateField: 'private value',
        publicField: 'public value',
      },
    })

    const apiKey = uuid()
    const user = await payload.create({
      collection: apiKeysSlug,
      data: {
        apiKey,
        enableAPIKey: true,
        restrictedField: 'restricted value',
        restrictedRelationship: restrictedRelationship.id,
      } as any,
    })

    const response = await restClient.GET(`/${apiKeysSlug}/me`, {
      headers: {
        Authorization: `${apiKeysSlug} API-Key ${apiKey}`,
      },
    })
    const authenticated: {
      user: {
        id: number | string
        restrictedField?: string
        restrictedRelationship?:
          | {
              id: number | string
              privateField?: string
              publicField?: string
            }
          | number
      } | null
    } = await response.json()
    const userWithReadAccess = authenticated.user

    expect(userWithReadAccess?.id).toBe(user.id)
    expect(userWithReadAccess).not.toHaveProperty('restrictedField')
    expect(userWithReadAccess?.restrictedRelationship).toMatchObject({
      id: restrictedRelationship.id,
      publicField: 'public value',
    })
    expect(userWithReadAccess?.restrictedRelationship).not.toHaveProperty('privateField')
  })

  it('should run afterRead hooks and populate req.user at the configured auth depth', async () => {
    const restrictedRelationship = await payload.create({
      collection: restrictedRelationshipsSlug as any,
      data: {
        isPublic: true,
        publicField: 'public relationship',
      },
    })

    const apiKey = uuid()
    const user = await payload.create({
      collection: apiKeysSlug,
      data: {
        apiKey,
        enableAPIKey: true,
        restrictedField: 'restricted value',
        restrictedRelationship: restrictedRelationship.id,
      } as any,
    })

    const req = await createPayloadRequest({
      config: payload.config,
      request: new Request(
        'http://localhost/api/auth-read-hook?locale=fr&fallbackLocale=none&depth=2',
        {
          headers: {
            Authorization: `${apiKeysSlug} API-Key ${apiKey}`,
          },
        },
      ),
    })
    const graphQLReq = await createPayloadRequest({
      config: payload.config,
      request: new Request('http://localhost/api/graphql', {
        headers: {
          Authorization: `${apiKeysSlug} API-Key ${apiKey}`,
        },
      }),
    })

    const authenticatedUser = req.user as
      | ({
          authReadHookFallbackLocale?: false | string
          authReadHookLocale?: string
          authReadHookRan?: boolean
          authReadHookRelationshipValue?: string
          restrictedField?: string
          restrictedRelationship?: { id: number | string; publicField?: string }
        } & NonNullable<typeof req.user>)
      | null

    expect(authenticatedUser?.id).toBe(user.id)
    expect(authenticatedUser?.authReadHookFallbackLocale).toBe(false)
    expect(authenticatedUser?.authReadHookLocale).toBe('fr')
    expect(authenticatedUser?.authReadHookRan).toBe(true)
    expect(authenticatedUser?.authReadHookRelationshipValue).toBe('public relationship')
    expect(authenticatedUser?.restrictedField).toBe('restricted value')
    expect(authenticatedUser?.restrictedRelationship).toMatchObject({
      id: restrictedRelationship.id,
      publicField: 'public relationship',
    })
    expect(req.locale).toBe('fr')
    expect(req.fallbackLocale).toBe(false)
    expect(req.query.depth).toBe('2')
    expect(graphQLReq.user).toMatchObject({
      id: user.id,
      authReadHookRan: true,
      restrictedField: 'restricted value',
      restrictedRelationship: restrictedRelationship.id,
    })
  })
})
