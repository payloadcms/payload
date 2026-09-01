import type { Payload, PayloadRequest } from 'payload'

import crypto from 'crypto'
import path from 'path'
import { createLocalReq, Forbidden } from 'payload'
import { getEntityPermissions } from 'payload/internal'
import { fileURLToPath } from 'url'
import { v4 as uuid } from 'uuid'
import { afterAll, afterEach, beforeAll, describe, expect, it, vitest } from 'vitest'

import type { NextRESTClient } from '../../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../../__helpers/shared/initPayloadInt.js'
import { devUser } from '../../credentials.js'
import {
  apiKeysSlug,
  apiKeysWithHiddenKeysSlug,
  apiKeysWithReadableKeysSlug,
  apiKeysWithRestrictedFieldAccessSlug,
  partialDisableLocalStrategiesSlug,
  restrictedRelationshipsSlug,
  slug,
} from '../shared.js'

let payload: Payload
let restClient: NextRESTClient

const dirname = path.dirname(fileURLToPath(import.meta.url))

describe('API Key', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(
      dirname,
      'auth/api-key',
      undefined,
      '../config.ts',
    ))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  const createdAPIKeyIDs: Array<number | string> = []
  const createdHiddenAPIKeyIDs: Array<number | string> = []
  const createdReadableAPIKeyIDs: Array<number | string> = []
  const createdRestrictedAPIKeyIDs: Array<number | string> = []
  const createdRestrictedRelationshipIDs: Array<number | string> = []
  const createdLockIDs: Array<number | string> = []

  afterEach(async () => {
    for (const id of createdLockIDs) {
      await payload.delete({
        collection: 'payload-locked-documents',
        where: { id: { equals: id } },
      })
    }

    for (const id of createdReadableAPIKeyIDs) {
      await payload.delete({
        collection: apiKeysWithReadableKeysSlug,
        where: { id: { equals: id } },
      })
    }

    for (const id of createdRestrictedRelationshipIDs) {
      await payload.delete({
        collection: restrictedRelationshipsSlug,
        where: { id: { equals: id } },
      })
    }

    for (const id of createdHiddenAPIKeyIDs) {
      await payload.delete({
        collection: apiKeysWithHiddenKeysSlug,
        where: { id: { equals: id } },
      })
    }

    for (const id of createdRestrictedAPIKeyIDs) {
      await payload.delete({
        collection: apiKeysWithRestrictedFieldAccessSlug,
        where: { id: { equals: id } },
      })
    }

    for (const id of createdAPIKeyIDs) {
      await payload.delete({
        collection: apiKeysSlug,
        where: { id: { equals: id } },
      })
    }

    createdAPIKeyIDs.length = 0
    createdHiddenAPIKeyIDs.length = 0
    createdReadableAPIKeyIDs.length = 0
    createdRestrictedAPIKeyIDs.length = 0
    createdRestrictedRelationshipIDs.length = 0
    createdLockIDs.length = 0
  })

  describe('authenticated user access', () => {
    it('should apply field access to API-key-authenticated relationships', async () => {
      const peer = await payload.create({
        collection: restrictedRelationshipsSlug,
        data: {
          privateField: 'private value',
          publicField: 'public value',
        },
      })

      createdRestrictedRelationshipIDs.push(peer.id)

      const apiKey = uuid()
      const user = await payload.create({
        collection: apiKeysWithReadableKeysSlug,
        data: {
          apiKey,
          enableAPIKey: true,
          peer: peer.id,
        },
      })

      createdReadableAPIKeyIDs.push(user.id)

      const authenticated = await payload.auth({
        headers: new Headers({
          Authorization: `${apiKeysWithReadableKeysSlug} API-Key ${apiKey}`,
        }),
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

    it('should apply query constraints to API-key-authenticated relationships', async () => {
      const peer = await payload.create({
        collection: restrictedRelationshipsSlug,
        data: {
          isPublic: false,
          privateField: 'restricted value',
          publicField: 'restricted relationship',
        },
      })

      createdRestrictedRelationshipIDs.push(peer.id)

      const apiKey = uuid()
      const user = await payload.create({
        collection: apiKeysWithReadableKeysSlug,
        data: {
          apiKey,
          enableAPIKey: true,
          peer: peer.id,
        },
      })

      createdReadableAPIKeyIDs.push(user.id)

      const authenticated = await payload.auth({
        headers: new Headers({
          Authorization: `${apiKeysWithReadableKeysSlug} API-Key ${apiKey}`,
        }),
      })
      const authenticatedUser = authenticated.user as {
        peer?: { id: number | string; publicField?: string } | number | string
      } & typeof authenticated.user

      expect(authenticatedUser?.id).toBe(user.id)
      expect(authenticatedUser?.peer).toBe(peer.id)
      expect(JSON.stringify(authenticatedUser)).not.toContain('restricted relationship')
    })

    it('should omit unreadable fields from API-key-authenticated users', async () => {
      expect(payload.collections[apiKeysWithHiddenKeysSlug].config.auth.depth).toBe(0)

      const apiKey = uuid()
      const user = await payload.create({
        collection: apiKeysWithHiddenKeysSlug,
        data: { apiKey, enableAPIKey: true },
      })

      createdHiddenAPIKeyIDs.push(user.id)

      const authenticated = await payload.auth({
        headers: new Headers({
          Authorization: `${apiKeysWithHiddenKeysSlug} API-Key ${apiKey}`,
        }),
      })

      expect(authenticated.user?.id).toBe(user.id)
      expect(authenticated.user).not.toHaveProperty('apiKey')
    })
  })

  describe('permissions', () => {
    it('should allow ID-aware field access to read a self-owned API key', async () => {
      const { docs } = await payload.find({
        collection: slug,
        limit: 1,
        where: { email: { equals: devUser.email } },
      })
      const user = docs[0]!
      const req = await createLocalReq({ user }, payload)

      const permissions = await getEntityPermissions({
        id: user.id,
        blockReferencesPermissions: {},
        entity: payload.collections[slug].config,
        entityType: 'collection',
        fetchData: true,
        operations: ['read'],
        req,
      })

      expect(permissions.fields.apiKey?.read?.permission).toBe(true)
    })

    it('should allow collection fields to open API key read access', async () => {
      const { docs } = await payload.find({
        collection: slug,
        limit: 1,
        where: { email: { equals: devUser.email } },
      })
      const target = await payload.create({
        collection: apiKeysWithReadableKeysSlug,
        data: {
          enableAPIKey: true,
        },
      })

      createdReadableAPIKeyIDs.push(target.id)

      const req = await createLocalReq({ user: docs[0] }, payload)

      const permissions = await getEntityPermissions({
        id: target.id,
        blockReferencesPermissions: {},
        entity: payload.collections[apiKeysWithReadableKeysSlug].config,
        entityType: 'collection',
        fetchData: true,
        operations: ['read'],
        req,
      })

      expect(permissions.fields.apiKey?.read?.permission).toBe(true)
    })

    it('should preserve async API key update access from collection fields', async () => {
      const { docs } = await payload.find({
        collection: slug,
        limit: 1,
        where: { email: { equals: devUser.email } },
      })
      const target = await payload.create({
        collection: apiKeysWithRestrictedFieldAccessSlug,
        data: {
          enableAPIKey: true,
        },
      })

      createdRestrictedAPIKeyIDs.push(target.id)

      const req = await createLocalReq({ user: docs[0] }, payload)

      const permissions = await getEntityPermissions({
        id: target.id,
        blockReferencesPermissions: {},
        entity: payload.collections[apiKeysWithRestrictedFieldAccessSlug].config,
        entityType: 'collection',
        fetchData: true,
        operations: ['update'],
        req,
      })

      expect(permissions.fields.apiKey?.update?.permission).toBe(false)
    })
  })

  describe('API key assignment', () => {
    const staticAPIKey = '01234567-89ab-cdef-0123-456789abcdef'
    const staticAPIKeyIndex = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

    it('should reject a caller-supplied API key through REST', async () => {
      const { token } = await payload.login({
        collection: slug,
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })

      const response = await restClient.POST(`/${apiKeysSlug}`, {
        body: JSON.stringify({
          apiKey: staticAPIKey,
          enableAPIKey: true,
        }),
        headers: {
          Authorization: `JWT ${token}`,
        },
      })
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.errors[0]?.data?.errors).toEqual([expect.objectContaining({ path: 'apiKey' })])
    })

    it('should reject a caller-supplied API key through GraphQL', async () => {
      const { token } = await payload.login({
        collection: slug,
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })
      const result = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({
            query: `mutation {
                createApiKey(data: {
                  apiKey: "${staticAPIKey}"
                  enableAPIKey: true
                }) {
                  id
                }
              }`,
          }),
          headers: {
            Authorization: `JWT ${token}`,
          },
        })
        .then((response) => response.json())

      expect(result.errors[0]?.extensions?.data?.errors).toEqual([
        expect.objectContaining({ path: 'apiKey' }),
      ])
    })

    it('should reject a caller-supplied API key index through REST', async () => {
      const originalAPIKey = uuid()
      const user = await payload.create({
        collection: apiKeysSlug,
        data: {
          apiKey: originalAPIKey,
          enableAPIKey: true,
        },
      })

      createdAPIKeyIDs.push(user.id)

      const storedBefore = await payload.findByID({
        id: user.id,
        collection: apiKeysSlug,
        showHiddenFields: true,
      })
      const { token } = await payload.login({
        collection: slug,
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })

      const response = await restClient.PATCH(`/${apiKeysSlug}/${user.id}`, {
        body: JSON.stringify({ apiKeyIndex: staticAPIKeyIndex }),
        headers: {
          Authorization: `JWT ${token}`,
        },
      })
      const result = await response.json()
      const storedAfter = await payload.findByID({
        id: user.id,
        collection: apiKeysSlug,
        showHiddenFields: true,
      })

      expect(response.status).toBe(400)
      expect(result.errors[0]?.data?.errors).toEqual([
        expect.objectContaining({ path: 'apiKeyIndex' }),
      ])
      expect(storedAfter.apiKeyIndex).toBe(storedBefore.apiKeyIndex)
    })

    it('should reject a caller-supplied API key index through GraphQL', async () => {
      const { token } = await payload.login({
        collection: slug,
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })

      const { data, errors } = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({
            query: `mutation {
                createApiKey(data: { apiKeyIndex: "${staticAPIKeyIndex}" }) {
                  id
                }
              }`,
          }),
          headers: {
            Authorization: `JWT ${token}`,
          },
        })
        .then((response) => response.json())

      if (data?.createApiKey?.id) {
        await payload.delete({
          id: data.createApiKey.id,
          collection: apiKeysSlug,
        })
      }

      expect(data?.createApiKey).toBeNull()
      expect(errors?.[0]?.extensions?.data?.errors).toEqual([
        expect.objectContaining({ path: 'apiKeyIndex' }),
      ])
    })

    it('should reject a caller-supplied API key through the Local API without overrideAccess', async () => {
      const { docs } = await payload.find({
        collection: slug,
        limit: 1,
        where: {
          email: {
            equals: devUser.email,
          },
        },
      })

      await expect(
        payload.create({
          collection: apiKeysSlug,
          data: {
            apiKey: staticAPIKey,
            enableAPIKey: true,
          },
          overrideAccess: false,
          user: docs[0],
        }),
      ).rejects.toMatchObject({
        data: {
          errors: [expect.objectContaining({ path: 'apiKey' })],
        },
      })
    })

    it('should allow a caller-supplied API key through the Local API with overrideAccess', async () => {
      const user = await payload.create({
        collection: apiKeysSlug,
        data: {
          apiKey: staticAPIKey,
          enableAPIKey: true,
        },
        overrideAccess: true,
      })

      createdAPIKeyIDs.push(user.id)

      expect(user.apiKey).toBe(staticAPIKey)
    })

    it('should reject a caller-supplied API key when updating through REST', async () => {
      const originalAPIKey = uuid()
      const user = await payload.create({
        collection: apiKeysSlug,
        data: {
          apiKey: originalAPIKey,
          enableAPIKey: true,
        },
      })

      createdAPIKeyIDs.push(user.id)

      const { token } = await payload.login({
        collection: slug,
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })

      const response = await restClient.PATCH(`/${apiKeysSlug}/${user.id}`, {
        body: JSON.stringify({ apiKey: staticAPIKey }),
        headers: {
          Authorization: `JWT ${token}`,
        },
      })
      const updated = await payload.findByID({
        id: user.id,
        collection: apiKeysSlug,
      })

      expect(response.status).toBe(400)
      expect(updated.apiKey).toBe(originalAPIKey)
    })

    it('should reject clearing an API key through REST', async () => {
      const originalAPIKey = uuid()
      const user = await payload.create({
        collection: apiKeysSlug,
        data: {
          apiKey: originalAPIKey,
          enableAPIKey: true,
        },
      })

      createdAPIKeyIDs.push(user.id)

      const { token } = await payload.login({
        collection: slug,
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })

      const response = await restClient.PATCH(`/${apiKeysSlug}/${user.id}`, {
        body: JSON.stringify({ apiKey: null }),
        headers: {
          Authorization: `JWT ${token}`,
        },
      })
      const result = await response.json()
      const updated = await payload.findByID({
        id: user.id,
        collection: apiKeysSlug,
      })

      expect(response.status).toBe(400)
      expect(result.errors[0]?.data?.errors).toEqual([expect.objectContaining({ path: 'apiKey' })])
      expect(updated.apiKey).toBe(originalAPIKey)
    })

    it('should reject clearing an API key through the Local API without overrideAccess', async () => {
      const originalAPIKey = uuid()
      const user = await payload.create({
        collection: apiKeysSlug,
        data: {
          apiKey: originalAPIKey,
          enableAPIKey: true,
        },
      })

      createdAPIKeyIDs.push(user.id)

      const { docs } = await payload.find({
        collection: slug,
        limit: 1,
        where: {
          email: {
            equals: devUser.email,
          },
        },
      })

      await expect(
        payload.update({
          id: user.id,
          collection: apiKeysSlug,
          data: {
            apiKey: null,
          },
          overrideAccess: false,
          user: docs[0],
        }),
      ).rejects.toMatchObject({
        data: {
          errors: [expect.objectContaining({ path: 'apiKey' })],
        },
      })

      const updated = await payload.findByID({
        id: user.id,
        collection: apiKeysSlug,
      })

      expect(updated.apiKey).toBe(originalAPIKey)
    })

    it('should allow a caller-supplied API key update through the Local API with overrideAccess', async () => {
      const user = await payload.create({
        collection: apiKeysSlug,
        data: {
          enableAPIKey: true,
        },
      })

      createdAPIKeyIDs.push(user.id)

      const updated = await payload.update({
        id: user.id,
        collection: apiKeysSlug,
        data: {
          apiKey: staticAPIKey,
        },
        overrideAccess: true,
      })

      expect(updated.apiKey).toBe(staticAPIKey)
    })
  })

  describe('server-generated API keys', () => {
    it('should generate an API key when creating an enabled document', async () => {
      const user = await payload.create({
        collection: apiKeysSlug,
        data: {
          enableAPIKey: true,
        },
      })

      createdAPIKeyIDs.push(user.id)

      expect(user.apiKey).toEqual(expect.any(String))
      const rawUser = await payload.db.findOne<Record<string, unknown>>({
        collection: apiKeysSlug,
        req: { locale: 'en' } as PayloadRequest,
        where: { id: { equals: user.id } },
      })
      expect(rawUser?.apiKeyIndex).toEqual(expect.any(String))

      const response = await restClient
        .GET(`/${apiKeysSlug}/me`, {
          headers: {
            Authorization: `${apiKeysSlug} API-Key ${user.apiKey}`,
          },
        })
        .then((result) => result.json())

      expect(response.user?.id).toBe(user.id)
    })

    it('should generate an API key when enabling a document without one', async () => {
      const user = await payload.create({
        collection: apiKeysSlug,
        data: {
          enableAPIKey: false,
        },
      })

      createdAPIKeyIDs.push(user.id)

      const enabledUser = await payload.update({
        id: user.id,
        collection: apiKeysSlug,
        data: {
          enableAPIKey: true,
        },
      })

      expect(enabledUser.apiKey).toEqual(expect.any(String))

      const response = await restClient
        .GET(`/${apiKeysSlug}/me`, {
          headers: {
            Authorization: `${apiKeysSlug} API-Key ${enabledUser.apiKey}`,
          },
        })
        .then((result) => result.json())

      expect(response.user?.id).toBe(user.id)
    })

    it('should restore the existing API key when re-enabling a document', async () => {
      const apiKey = uuid()
      const user = await payload.create({
        collection: apiKeysSlug,
        data: {
          apiKey,
          enableAPIKey: true,
        },
      })

      createdAPIKeyIDs.push(user.id)

      await payload.update({
        id: user.id,
        collection: apiKeysSlug,
        data: {
          enableAPIKey: false,
        },
      })

      const reenabledUser = await payload.update({
        id: user.id,
        collection: apiKeysSlug,
        data: {
          enableAPIKey: true,
        },
      })

      expect(reenabledUser.apiKey).toBe(apiKey)

      const response = await restClient
        .GET(`/${apiKeysSlug}/me`, {
          headers: {
            Authorization: `${apiKeysSlug} API-Key ${apiKey}`,
          },
        })
        .then((result) => result.json())

      expect(response.user?.id).toBe(user.id)
    })
  })

  describe('document duplication', () => {
    it('should generate a new API key when enabling a duplicate', async () => {
      const originalAPIKey = uuid()
      const source = await payload.create({
        collection: apiKeysWithReadableKeysSlug,
        data: { apiKey: originalAPIKey, enableAPIKey: true },
      })

      createdReadableAPIKeyIDs.push(source.id)

      await payload.update({
        id: source.id,
        collection: apiKeysWithReadableKeysSlug,
        data: { enableAPIKey: false },
      })

      const duplicate = await payload.duplicate({
        id: source.id,
        collection: apiKeysWithReadableKeysSlug,
      })

      createdReadableAPIKeyIDs.push(duplicate.id)

      expect(duplicate.enableAPIKey).toBe(false)
      expect(duplicate.apiKey).toBeNull()

      const enabledDuplicate = await payload.update({
        id: duplicate.id,
        collection: apiKeysWithReadableKeysSlug,
        data: { enableAPIKey: true },
      })
      const withOriginalKey = await payload.auth({
        headers: new Headers({
          Authorization: `${apiKeysWithReadableKeysSlug} API-Key ${originalAPIKey}`,
        }),
      })
      const withDuplicateKey = await payload.auth({
        headers: new Headers({
          Authorization: `${apiKeysWithReadableKeysSlug} API-Key ${enabledDuplicate.apiKey}`,
        }),
      })

      expect(enabledDuplicate.apiKey).toEqual(expect.any(String))
      expect(enabledDuplicate.apiKey).not.toBe(originalAPIKey)
      expect(withOriginalKey.user).toBeNull()
      expect(withDuplicateKey.user?.id).toBe(duplicate.id)
    })
  })

  describe('generate API key endpoint', () => {
    let authenticatedUserID: number | string
    let token: string

    beforeAll(async () => {
      const loginResult = await payload.login({
        collection: slug,
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })

      authenticatedUserID = loginResult.user.id
      token = loginResult.token
    })

    afterEach(() => {
      vitest.restoreAllMocks()
    })

    it('should reject unauthenticated requests before API key access checks', async () => {
      const updateAccess = vitest.spyOn(
        payload.collections[partialDisableLocalStrategiesSlug].config.access,
        'update',
      )

      const response = await restClient.POST(
        `/${partialDisableLocalStrategiesSlug}/generate-api-key/inaccessible-document`,
        {
          auth: false,
        },
      )

      expect(response.status).toBe(403)
      expect(updateAccess).not.toHaveBeenCalled()
    })

    it('should reject collections with API keys disabled before access checks', async () => {
      const updateAccess = vitest.spyOn(
        payload.collections[partialDisableLocalStrategiesSlug].config.access,
        'update',
      )

      const response = await restClient.POST(
        `/${partialDisableLocalStrategiesSlug}/generate-api-key/inaccessible-document`,
        {
          headers: {
            Authorization: `JWT ${token}`,
          },
        },
      )

      expect(response.status).toBe(403)
      expect(updateAccess).not.toHaveBeenCalled()
    })

    it('should return a generated API key to its owner', async () => {
      const response = await restClient.POST(`/${slug}/generate-api-key/${authenticatedUserID}`, {
        headers: {
          Authorization: `JWT ${token}`,
        },
      })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.apiKey).toEqual(expect.any(String))
    })

    it('should immediately generate and return a readable API key', async () => {
      const originalAPIKey = uuid()
      const user = await payload.create({
        collection: apiKeysWithReadableKeysSlug,
        data: {
          apiKey: originalAPIKey,
          enableAPIKey: true,
        },
      })

      createdReadableAPIKeyIDs.push(user.id)

      const response = await restClient.POST(
        `/${apiKeysWithReadableKeysSlug}/generate-api-key/${user.id}`,
        {
          headers: {
            Authorization: `JWT ${token}`,
          },
        },
      )
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.apiKey).toEqual(expect.any(String))
      expect(result.apiKey).not.toBe(originalAPIKey)
      const rawUser = await payload.db.findOne<Record<string, unknown>>({
        collection: apiKeysWithReadableKeysSlug,
        req: { locale: 'en' } as PayloadRequest,
        where: { id: { equals: user.id } },
      })
      expect(rawUser?.apiKeyIndex).toBe(
        crypto.createHmac('sha256', payload.secret).update(result.apiKey).digest('hex'),
      )
    })

    it('should apply the generated API key immediately', async () => {
      const originalAPIKey = uuid()
      const user = await payload.create({
        collection: apiKeysSlug,
        data: {
          apiKey: originalAPIKey,
          enableAPIKey: true,
        },
      })

      createdAPIKeyIDs.push(user.id)

      const response = await restClient.POST(`/${apiKeysSlug}/generate-api-key/${user.id}`, {
        headers: {
          Authorization: `JWT ${token}`,
        },
      })
      const result = await response.json()
      const updated = await payload.findByID({
        id: user.id,
        collection: apiKeysSlug,
      })

      expect(response.status).toBe(200)
      expect(result).not.toHaveProperty('apiKey')
      expect(updated.apiKey).not.toBe(originalAPIKey)

      const oldAuthentication = await restClient
        .GET(`/${apiKeysSlug}/me`, {
          headers: {
            Authorization: `${apiKeysSlug} API-Key ${originalAPIKey}`,
          },
        })
        .then((authResponse) => authResponse.json())
      const newAuthentication = await restClient
        .GET(`/${apiKeysSlug}/me`, {
          headers: {
            Authorization: `${apiKeysSlug} API-Key ${updated.apiKey}`,
          },
        })
        .then((authResponse) => authResponse.json())

      expect(oldAuthentication.user).toBeNull()
      expect(newAuthentication.user?.id).toBe(user.id)
    })

    it('should immediately generate an unreadable API key without returning it', async () => {
      const originalAPIKey = uuid()
      const user = await payload.create({
        collection: apiKeysWithHiddenKeysSlug,
        data: {
          apiKey: originalAPIKey,
          enableAPIKey: true,
        },
      })

      createdHiddenAPIKeyIDs.push(user.id)

      const response = await restClient.POST(
        `/${apiKeysWithHiddenKeysSlug}/generate-api-key/${user.id}`,
        {
          headers: {
            Authorization: `JWT ${token}`,
          },
        },
      )
      const result = await response.json()
      const updated = await payload.findByID({
        id: user.id,
        collection: apiKeysWithHiddenKeysSlug,
      })

      expect(response.status).toBe(200)
      expect(result).not.toHaveProperty('apiKey')
      expect(updated.apiKey).toEqual(expect.any(String))
      expect(updated.apiKey).not.toBe(originalAPIKey)
    })

    it('should rotate a disabled API key without enabling it', async () => {
      const originalAPIKey = uuid()
      const user = await payload.create({
        collection: apiKeysWithReadableKeysSlug,
        data: {
          apiKey: originalAPIKey,
          enableAPIKey: true,
        },
      })

      createdReadableAPIKeyIDs.push(user.id)

      const withEnabledKey = await payload.auth({
        headers: new Headers({
          Authorization: `${apiKeysWithReadableKeysSlug} API-Key ${originalAPIKey}`,
        }),
      })

      expect(withEnabledKey.user?.id).toBe(user.id)

      const disabled = await payload.update({
        id: user.id,
        collection: apiKeysWithReadableKeysSlug,
        data: { enableAPIKey: false },
      })
      const withDisabledKey = await payload.auth({
        headers: new Headers({
          Authorization: `${apiKeysWithReadableKeysSlug} API-Key ${originalAPIKey}`,
        }),
      })

      expect(disabled.enableAPIKey).toBe(false)
      expect(withDisabledKey.user).toBeNull()

      const response = await restClient.POST(
        `/${apiKeysWithReadableKeysSlug}/generate-api-key/${user.id}`,
        {
          headers: {
            Authorization: `JWT ${token}`,
          },
        },
      )
      const result = await response.json()
      const updated = await payload.findByID({
        id: user.id,
        collection: apiKeysWithReadableKeysSlug,
      })

      expect(response.status).toBe(200)
      expect(result.apiKey).toEqual(expect.any(String))
      expect(result.apiKey).not.toBe(originalAPIKey)
      expect(updated.apiKey).toBe(result.apiKey)
      expect(updated.enableAPIKey).toBe(false)

      const withRegeneratedDisabledKey = await payload.auth({
        headers: new Headers({
          Authorization: `${apiKeysWithReadableKeysSlug} API-Key ${result.apiKey}`,
        }),
      })

      expect(withRegeneratedDisabledKey.user).toBeNull()
    })

    it('should omit related API keys from the authenticated user', async () => {
      expect(payload.collections[apiKeysWithReadableKeysSlug].config.auth.depth).toBe(1)

      const apiKeyPeerAPIKey = uuid()
      const apiKeyPeer = await payload.create({
        collection: apiKeysSlug,
        data: { apiKey: apiKeyPeerAPIKey, enableAPIKey: true },
      })

      createdAPIKeyIDs.push(apiKeyPeer.id)

      const apiKey = uuid()
      const user = await payload.create({
        collection: apiKeysWithReadableKeysSlug,
        data: {
          apiKey,
          apiKeyPeer: apiKeyPeer.id,
          enableAPIKey: true,
        },
      })

      createdReadableAPIKeyIDs.push(user.id)

      const authenticated = await payload.auth({
        headers: new Headers({
          Authorization: `${apiKeysWithReadableKeysSlug} API-Key ${apiKey}`,
        }),
      })
      const authenticatedUser = authenticated.user as {
        apiKeyPeer?: { apiKey?: string; id: number | string } | number
      } & typeof authenticated.user

      expect(authenticatedUser?.id).toBe(user.id)
      expect(authenticatedUser?.apiKeyPeer).toMatchObject({ id: apiKeyPeer.id })
      expect(authenticatedUser?.apiKeyPeer).not.toHaveProperty('apiKey')
    })

    it('should generate a missing API key without enabling it', async () => {
      const user = await payload.create({
        collection: apiKeysWithReadableKeysSlug,
        data: {
          enableAPIKey: false,
        },
      })

      createdReadableAPIKeyIDs.push(user.id)

      const response = await restClient.POST(
        `/${apiKeysWithReadableKeysSlug}/generate-api-key/${user.id}`,
        {
          headers: {
            Authorization: `JWT ${token}`,
          },
        },
      )
      const result = await response.json()
      const stored = await payload.findByID({
        id: user.id,
        collection: apiKeysWithReadableKeysSlug,
      })

      expect(response.status).toBe(200)
      expect(result.apiKey).toEqual(expect.any(String))
      expect(stored.apiKey).toBe(result.apiKey)
      expect(stored.enableAPIKey).toBe(false)

      const authentication = await restClient
        .GET(`/${apiKeysWithReadableKeysSlug}/me`, {
          headers: {
            Authorization: `${apiKeysWithReadableKeysSlug} API-Key ${result.apiKey}`,
          },
        })
        .then((authResponse) => authResponse.json())

      expect(authentication.user).toBeNull()
    })

    it('should preserve the document lock only for API key generation', async () => {
      const user = await payload.create({
        collection: apiKeysWithReadableKeysSlug,
        data: {
          enableAPIKey: false,
        },
      })

      createdReadableAPIKeyIDs.push(user.id)

      const lock = await payload.create({
        collection: 'payload-locked-documents',
        data: {
          document: {
            relationTo: apiKeysWithReadableKeysSlug,
            value: user.id,
          },
          user: {
            relationTo: slug,
            value: authenticatedUserID,
          },
        },
      })

      createdLockIDs.push(lock.id)

      const response = await restClient.POST(
        `/${apiKeysWithReadableKeysSlug}/generate-api-key/${user.id}`,
        {
          headers: {
            Authorization: `JWT ${token}`,
          },
        },
      )
      const locksAfterGeneration = await payload.find({
        collection: 'payload-locked-documents',
        where: { id: { equals: lock.id } },
      })

      expect(response.status).toBe(200)
      expect(locksAfterGeneration.docs).toHaveLength(1)

      await payload.update({
        id: user.id,
        collection: apiKeysWithReadableKeysSlug,
        data: {
          apiKey: uuid(),
        },
      })

      const locksAfterDirectUpdate = await payload.find({
        collection: 'payload-locked-documents',
        where: { id: { equals: lock.id } },
      })

      expect(locksAfterDirectUpdate.docs).toHaveLength(0)
    })

    it('should reject automatic API key creation without field access', async () => {
      const { docs } = await payload.find({
        collection: slug,
        limit: 1,
        where: {
          email: {
            equals: devUser.email,
          },
        },
      })

      await expect(
        payload.create({
          collection: apiKeysWithRestrictedFieldAccessSlug,
          data: {
            enableAPIKey: true,
          },
          overrideAccess: false,
          user: docs[0],
        }),
      ).rejects.toBeInstanceOf(Forbidden)
    })

    it('should reject automatic API key generation without field access', async () => {
      const user = await payload.create({
        collection: apiKeysWithRestrictedFieldAccessSlug,
        data: {
          enableAPIKey: false,
        },
      })

      createdRestrictedAPIKeyIDs.push(user.id)

      const { docs } = await payload.find({
        collection: slug,
        limit: 1,
        where: {
          email: {
            equals: devUser.email,
          },
        },
      })

      await expect(
        payload.update({
          id: user.id,
          collection: apiKeysWithRestrictedFieldAccessSlug,
          data: {
            enableAPIKey: true,
          },
          overrideAccess: false,
          user: docs[0],
        }),
      ).rejects.toBeInstanceOf(Forbidden)

      const stored = await payload.db.findOne<Record<string, unknown>>({
        collection: apiKeysWithRestrictedFieldAccessSlug,
        req: { locale: 'en' } as PayloadRequest,
        where: { id: { equals: user.id } },
      })

      expect(stored?.enableAPIKey).toBe(false)
      expect(stored?.apiKey).toBeNull()
      expect(stored?.apiKeyIndex).toBeNull()
    })

    it('should respect custom API key update access', async () => {
      const originalAPIKey = uuid()
      const user = await payload.create({
        collection: apiKeysWithRestrictedFieldAccessSlug,
        data: {
          apiKey: originalAPIKey,
          enableAPIKey: true,
        },
      })

      createdRestrictedAPIKeyIDs.push(user.id)

      const response = await restClient.POST(
        `/${apiKeysWithRestrictedFieldAccessSlug}/generate-api-key/${user.id}`,
        {
          headers: {
            Authorization: `JWT ${token}`,
          },
        },
      )
      const updated = await payload.findByID({
        id: user.id,
        collection: apiKeysWithRestrictedFieldAccessSlug,
      })

      expect(response.status).toBe(403)
      expect(updated.apiKey).toBe(originalAPIKey)
    })

    it('should reject a caller-supplied API key', async () => {
      const originalAPIKey = uuid()
      const user = await payload.create({
        collection: apiKeysWithReadableKeysSlug,
        data: {
          apiKey: originalAPIKey,
          enableAPIKey: true,
        },
      })

      createdReadableAPIKeyIDs.push(user.id)

      const response = await restClient.POST(
        `/${apiKeysWithReadableKeysSlug}/generate-api-key/${user.id}`,
        {
          body: JSON.stringify({ apiKey: 'caller-selected-key' }),
          headers: {
            Authorization: `JWT ${token}`,
          },
        },
      )
      const updated = await payload.findByID({
        id: user.id,
        collection: apiKeysWithReadableKeysSlug,
      })

      expect(response.status).toBe(400)
      expect(updated.apiKey).toBe(originalAPIKey)
    })

    it('should require document update access', async () => {
      const originalAPIKey = uuid()
      const user = await payload.create({
        collection: apiKeysWithReadableKeysSlug,
        data: {
          apiKey: originalAPIKey,
          enableAPIKey: true,
        },
      })

      createdReadableAPIKeyIDs.push(user.id)

      const response = await restClient.POST(
        `/${apiKeysWithReadableKeysSlug}/generate-api-key/${user.id}`,
        {
          auth: false,
        },
      )
      const updated = await payload.findByID({
        id: user.id,
        collection: apiKeysWithReadableKeysSlug,
      })

      expect(response.status).toBe(403)
      expect(updated.apiKey).toBe(originalAPIKey)
    })

    it('should check document update access before the enabled state', async () => {
      const user = await payload.create({
        collection: apiKeysWithReadableKeysSlug,
        data: {
          enableAPIKey: false,
        },
      })

      createdReadableAPIKeyIDs.push(user.id)

      const response = await restClient.POST(
        `/${apiKeysWithReadableKeysSlug}/generate-api-key/${user.id}`,
        {
          auth: false,
        },
      )

      expect(response.status).toBe(403)
    })

    it('should check document update access before validating a caller-supplied key', async () => {
      const user = await payload.create({
        collection: apiKeysWithReadableKeysSlug,
        data: {
          enableAPIKey: true,
        },
      })

      createdReadableAPIKeyIDs.push(user.id)

      const response = await restClient.POST(
        `/${apiKeysWithReadableKeysSlug}/generate-api-key/${user.id}`,
        {
          auth: false,
          body: JSON.stringify({ apiKey: 'caller-selected-key' }),
        },
      )

      expect(response.status).toBe(403)
    })
  })
})
