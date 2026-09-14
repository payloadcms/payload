import { createPayloadRequest } from 'payload'
import { v4 as uuid } from 'uuid'
import { expect } from 'vitest'

import { test } from '../../__helpers/int/vitest.js'
import { apiKeysSlug, restrictedRelationshipsSlug } from './shared.js'

test.suite({ config: './config.ts' })('API key authentication', () => {
  test('should return a user with read access from API key authentication', async ({
    payload,
    restClient,
  }) => {
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

    const authenticated = await restClient
      .GET(`/${apiKeysSlug}/me`, {
        headers: {
          Authorization: `${apiKeysSlug} API-Key ${apiKey}`,
        },
      })
      .then((response) => response.json())

    const userWithReadAccess = authenticated.user as {
      restrictedRelationship?:
        | {
            id: number | string
            privateField?: string
            publicField?: string
          }
        | number
    }

    expect(userWithReadAccess.id).toBe(user.id)
    expect(userWithReadAccess).not.toHaveProperty('restrictedField')
    expect(userWithReadAccess.restrictedRelationship).toMatchObject({
      id: restrictedRelationship.id,
      publicField: 'public value',
    })
    expect(userWithReadAccess.restrictedRelationship).not.toHaveProperty('privateField')
  })

  test('should run afterRead hooks and populate req.user at the configured auth depth', async ({
    payload,
  }) => {
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
