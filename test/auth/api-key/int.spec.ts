import { createPayloadRequest } from 'payload'
import { v4 as uuid } from 'uuid'
import { expect } from 'vitest'

import { test } from '../../__helpers/int/vitest.js'
import {
  adminUsersSlug,
  apiKeysSlug,
  restrictedAPIKeysSlug,
  restrictedRelationshipsSlug,
} from './shared.js'

test.suite('API key authentication', { config: './config.ts' }, () => {
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
      overrideAccess: true,
    })

    const apiKey = uuid()
    const user = await payload.create({
      collection: apiKeysSlug,
      data: {
        apiKey,
        restrictedField: 'restricted value',
        restrictedRelationship: restrictedRelationship.id,
      } as any,
      overrideAccess: true,
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
    expect(userWithReadAccess).not.toHaveProperty('apiKey')
    expect(userWithReadAccess).not.toHaveProperty('apiKeyIndex')
    expect(userWithReadAccess).not.toHaveProperty('apiKeyLast4')
    expect(userWithReadAccess).not.toHaveProperty('hasAPIKey')
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
      overrideAccess: true,
    })

    const apiKey = uuid()
    const user = await payload.create({
      collection: apiKeysSlug,
      data: {
        apiKey,
        restrictedField: 'restricted value',
        restrictedRelationship: restrictedRelationship.id,
      } as any,
      overrideAccess: true,
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
          authReadHookHasAPIKey?: boolean
          authReadHookHasAPIKeyIndex?: boolean
          authReadHookLocale?: string
          authReadHookRan?: boolean
          authReadHookRelationshipValue?: string
          restrictedField?: string
          restrictedRelationship?: { id: number | string; publicField?: string }
        } & NonNullable<typeof req.user>)
      | null

    expect(authenticatedUser?.id).toBe(user.id)
    expect(authenticatedUser?.authReadHookFallbackLocale).toBe(false)
    expect(authenticatedUser?.authReadHookHasAPIKey).toBe(false)
    expect(authenticatedUser?.authReadHookHasAPIKeyIndex).toBe(false)
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
    expect(graphQLReq.user).not.toHaveProperty('apiKey')
    expect(graphQLReq.user).not.toHaveProperty('apiKeyIndex')
  })

  test('should expose write-only API key fields without the legacy enable field', async ({
    payload,
  }) => {
    const collection = payload.config.collections.find(({ slug }) => slug === apiKeysSlug)!
    const apiKeyField = collection.fields.find(
      (field) => 'name' in field && field.name === 'apiKey',
    )!

    expect(collection.fields).not.toContainEqual(expect.objectContaining({ name: 'enableAPIKey' }))
    expect(collection.fields).not.toContainEqual(expect.objectContaining({ name: 'hasAPIKey' }))
    expect('access' in apiKeyField && apiKeyField.access?.read).toBeTypeOf('function')
    expect(await apiKeyField.access!.read!({} as never)).toBe(false)
  })

  test('should omit secrets before hooks and return only the final four characters', async ({
    payload,
  }) => {
    const apiKey = uuid()
    const user = await payload.create({
      collection: apiKeysSlug,
      data: { apiKey } as any,
      overrideAccess: true,
    })

    const result = await payload.findByID({
      id: user.id,
      collection: apiKeysSlug,
      overrideAccess: true,
      showHiddenFields: true,
    })

    expect(result).not.toHaveProperty('apiKey')
    expect(result).not.toHaveProperty('apiKeyIndex')
    expect(result.apiKeyLast4).toBe(apiKey.slice(-4))
    expect(result.authBeforeReadHookHasAPIKey).toBe(false)
    expect(result.authBeforeReadHookHasAPIKeyIndex).toBe(false)
    expect(result.authReadHookHasAPIKey).toBe(false)
    expect(result.authReadHookHasAPIKeyIndex).toBe(false)
  })

  test('should ignore direct last-four and index updates', async ({ payload }) => {
    const apiKey = uuid()
    const user = await payload.create({
      collection: apiKeysSlug,
      data: { apiKey } as any,
      overrideAccess: true,
    })
    const findStoredUser = () =>
      payload.db.findOne({
        collection: apiKeysSlug,
        req: { locale: 'en' } as any,
        where: { id: { equals: user.id } },
      })
    const original = await findStoredUser()

    await payload.update({
      id: user.id,
      collection: apiKeysSlug,
      data: { apiKeyIndex: 'replacement-index', apiKeyLast4: 'fake' } as any,
      overrideAccess: true,
    })

    const updated = await findStoredUser()
    expect(updated?.apiKeyIndex).toBe(original?.apiKeyIndex)
    expect(updated?.apiKeyLast4).toBe(original?.apiKeyLast4)
  })

  test('should clear all API key storage when revoked', async ({ payload }) => {
    const user = await payload.create({
      collection: apiKeysSlug,
      data: { apiKey: uuid() } as any,
      overrideAccess: true,
    })

    await payload.update({
      id: user.id,
      collection: apiKeysSlug,
      data: { apiKey: null } as any,
      overrideAccess: true,
    })

    const stored = await payload.db.findOne({
      collection: apiKeysSlug,
      req: { locale: 'en' } as any,
      where: { id: { equals: user.id } },
    })
    expect(stored?.apiKey).toBeNull()
    expect(stored?.apiKeyIndex).toBeNull()
    expect(stored?.apiKeyLast4).toBeNull()

    const result = await payload.findByID({
      id: user.id,
      collection: apiKeysSlug,
      overrideAccess: true,
    })
    expect(result.apiKeyLast4).toBeNull()
  })

  test('should restrict API key management to accepted admin users by default', async ({
    payload,
  }) => {
    await payload.create({
      collection: adminUsersSlug as any,
      data: {
        canManageAPIKeys: true,
        canUpdateAPIKeys: true,
        email: 'manager@example.com',
        password: 'password',
      },
      overrideAccess: true,
    })
    const target = await payload.create({
      collection: adminUsersSlug as any,
      data: { email: 'target@example.com', password: 'password' },
      overrideAccess: true,
    })
    const token = (
      await payload.login({
        collection: adminUsersSlug as any,
        data: { email: 'manager@example.com', password: 'password' },
        overrideAccess: true,
      })
    ).token!
    const req = await createPayloadRequest({
      config: payload.config,
      request: new Request('http://localhost/api', {
        headers: { Authorization: `JWT ${token}` },
      }),
    })
    const collection = payload.config.collections.find(({ slug }) => slug === adminUsersSlug)!
    const apiKeyField = collection.fields.find(
      (field) => 'name' in field && field.name === 'apiKey',
    )!

    expect('access' in apiKeyField && apiKeyField.access?.update).toBeTypeOf('function')
    expect(await apiKeyField.access!.update!({ id: target.id, req } as never)).toBe(true)

    const unauthenticatedReq = await createPayloadRequest({
      config: payload.config,
      request: new Request('http://localhost/api'),
    })
    expect(
      await apiKeyField.access!.update!({ id: target.id, req: unauthenticatedReq } as never),
    ).toBe(false)
  })

  test('should allow applications to further restrict API key management', async ({
    payload,
    restClient,
  }) => {
    const admin = await payload.create({
      collection: adminUsersSlug as any,
      data: {
        canManageAPIKeys: false,
        canUpdateAPIKeys: true,
        email: 'restricted-manager@example.com',
        password: 'password',
      },
      overrideAccess: true,
    })
    const target = await payload.create({
      collection: restrictedAPIKeysSlug as any,
      data: {},
      overrideAccess: true,
    })
    const token = (
      await payload.login({
        collection: adminUsersSlug as any,
        data: { email: admin.email, password: 'password' },
        overrideAccess: true,
      })
    ).token!

    const response = await restClient.PATCH(`/${restrictedAPIKeysSlug}/${target.id}`, {
      body: JSON.stringify({ apiKey: uuid(), apiKeyIndex: 'attempted override' }),
      headers: { Authorization: `JWT ${token}` },
    })
    const stored = await payload.db.findOne({
      collection: restrictedAPIKeysSlug,
      req: { locale: 'en' } as any,
      where: { id: { equals: target.id } },
    })

    expect(response.status).toBe(200)
    expect(stored?.apiKeyIndex).not.toBeTypeOf('string')
    expect(stored?.apiKeyIndex).not.toBe('attempted override')
  })

  test('should preserve the current key when restoring a version', async ({
    payload,
    restClient,
  }) => {
    const originalAPIKey = uuid()
    const currentAPIKey = uuid()
    const user = await payload.create({
      collection: apiKeysSlug,
      data: { apiKey: originalAPIKey, restrictedField: 'original' } as any,
      overrideAccess: true,
    })

    await payload.update({
      id: user.id,
      collection: apiKeysSlug,
      data: { apiKey: currentAPIKey, restrictedField: 'current' } as any,
      overrideAccess: true,
    })
    const versions = await payload.findVersions({
      collection: apiKeysSlug,
      overrideAccess: true,
      where: { parent: { equals: user.id } },
    })
    const originalVersion = versions.docs.find(
      (version) => version.version.restrictedField === 'original',
    )!

    await payload.restoreVersion({
      id: originalVersion.id,
      collection: apiKeysSlug,
      overrideAccess: true,
    })

    const restored = await payload.db.findOne({
      collection: apiKeysSlug,
      req: { locale: 'en' } as any,
      where: { id: { equals: user.id } },
    })
    const currentAuth = await restClient
      .GET(`/${apiKeysSlug}/me`, {
        headers: { Authorization: `${apiKeysSlug} API-Key ${currentAPIKey}` },
      })
      .then((response) => response.json())
    const originalAuth = await restClient
      .GET(`/${apiKeysSlug}/me`, {
        headers: { Authorization: `${apiKeysSlug} API-Key ${originalAPIKey}` },
      })
      .then((response) => response.json())

    expect(restored?.restrictedField).toBe('original')
    expect(payload.decrypt(restored?.apiKey as string)).toBe(currentAPIKey)
    expect(restored?.apiKeyLast4).toBe(currentAPIKey.slice(-4))
    expect(currentAuth.user).toMatchObject({ id: user.id })
    expect(originalAuth.user).toBeNull()
  })

  test('should backfill the final four characters after successful authentication', async ({
    payload,
    restClient,
  }) => {
    const apiKey = uuid()
    const user = await payload.create({
      collection: apiKeysSlug,
      data: { apiKey } as any,
      overrideAccess: true,
    })

    await payload.db.updateOne({
      id: user.id,
      collection: apiKeysSlug,
      data: { apiKeyLast4: null },
      req: { locale: 'en' } as any,
    })

    const legacyResult = await payload.findByID({
      id: user.id,
      collection: apiKeysSlug,
      overrideAccess: true,
    })

    expect(legacyResult.apiKeyLast4).toBe('••••')

    const response = await restClient.GET(`/${apiKeysSlug}/me`, {
      headers: { Authorization: `${apiKeysSlug} API-Key ${apiKey}` },
    })
    const stored = await payload.db.findOne({
      collection: apiKeysSlug,
      req: { locale: 'en' } as any,
      where: { id: { equals: user.id } },
    })

    expect(response.status).toBe(200)
    expect(stored?.apiKeyLast4).toBe(apiKey.slice(-4))
  })

  test('should not register a built-in reveal route', async ({ payload, restClient }) => {
    const user = await payload.create({
      collection: apiKeysSlug,
      data: { apiKey: uuid() } as any,
      overrideAccess: true,
    })

    const response = await restClient.POST(`/${apiKeysSlug}/${user.id}/api-key/reveal`)

    expect(response.status).toBe(404)
  })
})
