import type { Payload } from 'payload'

import path from 'path'
import { createPayloadRequest } from 'payload'
import { fileURLToPath } from 'url'
import { v4 as uuid } from 'uuid'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../../__helpers/shared/initPayloadInt.js'
import { adminUsersSlug, apiKeysSlug, restrictedRelationshipsSlug } from './shared.js'

let payload: Payload
let restClient: NextRESTClient

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('API key authentication', () => {
  const adminUserIDs: Array<number | string> = []
  const createdAPIKeyIDs: Array<number | string> = []
  const createdRelationshipIDs: Array<number | string> = []
  let fieldDeniedToken: string
  let managerID: number | string
  let managerToken: string

  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname, 'auth/api-key'))

    const manager = await payload.create({
      collection: adminUsersSlug as any,
      data: {
        canManageAPIKeys: true,
        canUpdateAPIKeys: true,
        email: 'manager@example.com',
        password: 'password',
      },
    })
    const collectionDenied = await payload.create({
      collection: adminUsersSlug as any,
      data: {
        canManageAPIKeys: true,
        canUpdateAPIKeys: false,
        email: 'collection-denied@example.com',
        password: 'password',
      },
    })
    const fieldDenied = await payload.create({
      collection: adminUsersSlug as any,
      data: {
        canManageAPIKeys: false,
        canUpdateAPIKeys: true,
        email: 'field-denied@example.com',
        password: 'password',
      },
    })
    adminUserIDs.push(manager.id, collectionDenied.id, fieldDenied.id)
    managerID = manager.id

    managerToken = (
      await payload.login({
        collection: adminUsersSlug as any,
        data: { email: 'manager@example.com', password: 'password' },
      })
    ).token!
    fieldDeniedToken = (
      await payload.login({
        collection: adminUsersSlug as any,
        data: { email: 'field-denied@example.com', password: 'password' },
      })
    ).token!
  })

  afterAll(async () => {
    await payload.delete({
      collection: adminUsersSlug as any,
      where: {
        id: {
          in: adminUserIDs,
        },
      },
    })
    await payload.destroy()
  })

  afterEach(async () => {
    for (const id of createdRelationshipIDs) {
      await payload.delete({ id, collection: restrictedRelationshipsSlug as any })
    }
    for (const id of createdAPIKeyIDs) {
      await payload.delete({ id, collection: apiKeysSlug })
    }
    createdRelationshipIDs.length = 0
    createdAPIKeyIDs.length = 0
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

    createdRelationshipIDs.push(restrictedRelationship.id)
    createdAPIKeyIDs.push(user.id)

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
    expect(userWithReadAccess).not.toHaveProperty('apiKey')
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

    createdRelationshipIDs.push(restrictedRelationship.id)
    createdAPIKeyIDs.push(user.id)

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

  describe('ordinary reads', () => {
    let apiKey: string
    let relationshipID: number | string
    let userID: number | string

    beforeEach(async () => {
      apiKey = uuid()
      const user = await payload.create({
        collection: apiKeysSlug,
        data: {
          apiKey,
          enableAPIKey: true,
        } as any,
      })
      const relationship = await payload.create({
        collection: restrictedRelationshipsSlug as any,
        data: {
          apiKeyOwner: user.id,
          isPublic: true,
        },
      })

      userID = user.id
      relationshipID = relationship.id
      createdAPIKeyIDs.push(user.id)
      createdRelationshipIDs.push(relationship.id)
    })

    it('should deny field-level read access to apiKey by default', async () => {
      const collection = payload.config.collections.find(({ slug }) => slug === apiKeysSlug)!
      const apiKeyField = collection.fields.find(
        (field) => 'name' in field && field.name === 'apiKey',
      )!

      expect('access' in apiKeyField && apiKeyField.access?.read).toBeTypeOf('function')
      expect(await apiKeyField.access!.read!({} as never)).toBe(false)
    })

    it('should omit apiKey from Local API results', async () => {
      const result = await payload.findByID({
        id: userID,
        collection: apiKeysSlug,
      })

      expect(result).not.toHaveProperty('apiKey')
      expect(result).not.toHaveProperty('apiKeyIndex')
      expect(result.hasAPIKey).toBe(true)
    })

    it('should omit apiKey from REST results', async () => {
      const response = await restClient.GET(`/${apiKeysSlug}/${userID}`, {
        headers: {
          Authorization: `${apiKeysSlug} API-Key ${apiKey}`,
        },
      })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).not.toHaveProperty('apiKey')
      expect(result).not.toHaveProperty('apiKeyIndex')
      expect(result).not.toHaveProperty('hasAPIKey')
    })

    it('should omit apiKey from GraphQL results', async () => {
      const response = await restClient.GRAPHQL_POST({
        body: JSON.stringify({
          query: `query {
            ApiKey(id: ${JSON.stringify(userID)}) {
              apiKey
              id
            }
          }`,
        }),
        headers: {
          Authorization: `${apiKeysSlug} API-Key ${apiKey}`,
        },
      })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.errors).toBeUndefined()
      expect(result.data.ApiKey.apiKey).toBeNull()
    })

    it('should omit apiKey from populated relationships', async () => {
      const result = await payload.findByID({
        id: relationshipID,
        collection: restrictedRelationshipsSlug as any,
        depth: 1,
      })

      expect(result.apiKeyOwner).toMatchObject({ id: userID })
      expect(result.apiKeyOwner).not.toHaveProperty('apiKey')
      expect(result.apiKeyOwner).not.toHaveProperty('apiKeyIndex')
    })

    it('should omit apiKey before collection afterRead hooks run', async () => {
      const result = await payload.findByID({
        id: userID,
        collection: apiKeysSlug,
      })

      expect(result.authReadHookHasAPIKey).toBe(false)
      expect(result.authReadHookHasAPIKeyIndex).toBe(false)
    })

    it('should omit API key values before collection beforeRead hooks run', async () => {
      const result = await payload.findByID({
        id: userID,
        collection: apiKeysSlug,
      })

      expect(result.authBeforeReadHookHasAPIKey).toBe(false)
      expect(result.authBeforeReadHookHasAPIKeyIndex).toBe(false)
    })

    it('should omit apiKeyIndex when hidden fields are explicitly requested', async () => {
      const result = await payload.findByID({
        id: userID,
        collection: apiKeysSlug,
        showHiddenFields: true,
      })

      expect(result).not.toHaveProperty('apiKeyIndex')
    })

    it('should ignore direct apiKeyIndex updates', async () => {
      const findStoredUser = () =>
        payload.db.findOne({
          collection: apiKeysSlug,
          req: { locale: 'en' } as any,
          where: { id: { equals: userID } },
        })
      const originalAPIKeyIndex = (await findStoredUser())?.apiKeyIndex

      await payload.update({
        id: userID,
        collection: apiKeysSlug,
        data: { apiKeyIndex: 'replacement-index' } as any,
      })

      expect((await findStoredUser())?.apiKeyIndex).toBe(originalAPIKeyIndex)
    })

    it.each([
      { label: 'null', value: null },
      { label: 'an empty string', value: '' },
      { label: 'zero', value: 0 },
    ])('should clear all API key storage when set to $label', async ({ value }) => {
      await payload.update({
        id: userID,
        collection: apiKeysSlug,
        data: { apiKey: value } as any,
      })

      const storedUser = await payload.db.findOne({
        collection: apiKeysSlug,
        req: { locale: 'en' } as any,
        where: { id: { equals: userID } },
      })

      expect(storedUser?.apiKey).toBeNull()
      expect(storedUser?.apiKeyIndex).toBeNull()
    })

    it.each([
      { label: 'a non-empty string', value: uuid() },
      { label: 'whitespace', value: ' ' },
    ])('should store $label as an API key', async ({ value }) => {
      await payload.update({
        id: userID,
        collection: apiKeysSlug,
        data: { apiKey: value } as any,
      })

      const storedUser = await payload.db.findOne({
        collection: apiKeysSlug,
        req: { locale: 'en' } as any,
        where: { id: { equals: userID } },
      })

      expect(payload.decrypt(storedUser?.apiKey as string)).toBe(value)
      expect(storedUser?.apiKeyIndex).toBeTypeOf('string')
    })

    it('should preserve enableAPIKey false as a revocation shim', async () => {
      await payload.update({
        id: userID,
        collection: apiKeysSlug,
        data: { enableAPIKey: false } as any,
      })

      const storedUser = await payload.db.findOne({
        collection: apiKeysSlug,
        req: { locale: 'en' } as any,
        where: { id: { equals: userID } },
      })

      expect(storedUser?.apiKey).toBeNull()
      expect(storedUser?.apiKeyIndex).toBeNull()
    })

    it('should replace a key submitted with enableAPIKey false', async () => {
      const replacementAPIKey = uuid()

      await payload.update({
        id: userID,
        collection: apiKeysSlug,
        data: { apiKey: replacementAPIKey, enableAPIKey: false } as any,
      })

      const storedUser = await payload.db.findOne({
        collection: apiKeysSlug,
        req: { locale: 'en' } as any,
        where: { id: { equals: userID } },
      })

      expect(payload.decrypt(storedUser?.apiKey as string)).toBe(replacementAPIKey)
      expect(storedUser?.apiKeyIndex).toBeTypeOf('string')
    })

    it('should replace a key when enableAPIKey is false', async () => {
      const replacementAPIKey = uuid()

      await payload.update({
        id: userID,
        collection: apiKeysSlug,
        data: { enableAPIKey: false } as any,
      })
      await payload.update({
        id: userID,
        collection: apiKeysSlug,
        data: { apiKey: replacementAPIKey } as any,
      })
      await payload.update({
        id: userID,
        collection: apiKeysSlug,
        data: { name: 'Updated name' },
      })
      await payload.update({
        id: userID,
        collection: apiKeysSlug,
        data: { enableAPIKey: false } as any,
      })

      const storedUser = await payload.db.findOne({
        collection: apiKeysSlug,
        req: { locale: 'en' } as any,
        where: { id: { equals: userID } },
      })

      expect(payload.decrypt(storedUser?.apiKey as string)).toBe(replacementAPIKey)
      expect(storedUser?.apiKeyIndex).toBeTypeOf('string')
    })
  })

  describe('key management access', () => {
    const readStoredAdmin = (id: number | string) =>
      payload.db.findOne({
        collection: adminUsersSlug as any,
        req: { locale: 'en' } as any,
        where: { id: { equals: id } },
      })

    const clearStoredAdminKey = (id: number | string) =>
      payload.db.updateOne({
        id,
        collection: adminUsersSlug as any,
        data: { apiKey: null, apiKeyIndex: null },
        req: { locale: 'en' } as any,
      })

    it('should deny unauthenticated API key management by default', async () => {
      const apiKey = uuid()
      const targetID = adminUserIDs[2]!

      const response = await restClient.PATCH(`/${adminUsersSlug}/${targetID}`, {
        auth: false,
        body: JSON.stringify({ apiKey }),
      })

      const storedAdmin = await readStoredAdmin(targetID)
      await clearStoredAdminKey(targetID)

      expect(response.status).toBe(403)
      expect(storedAdmin?.apiKeyIndex).not.toBeTypeOf('string')
    })

    it('should deny non-Admin API key management by default', async () => {
      const apiKey = uuid()
      const user = await payload.create({
        collection: apiKeysSlug,
        data: { apiKey } as any,
      })
      createdAPIKeyIDs.push(user.id)

      const req = await createPayloadRequest({
        config: payload.config,
        request: new Request('http://localhost/api', {
          headers: { Authorization: `${apiKeysSlug} API-Key ${apiKey}` },
        }),
      })
      const adminCollection = payload.config.collections.find(
        ({ slug }) => slug === adminUsersSlug,
      )!
      const apiKeyField = adminCollection.fields.find(
        (field) => 'name' in field && field.name === 'apiKey',
      )!
      const enableAPIKeyField = adminCollection.fields.find(
        (field) => 'name' in field && field.name === 'enableAPIKey',
      )!

      expect('access' in apiKeyField && apiKeyField.access?.update).toBeTypeOf('function')
      expect(await apiKeyField.access!.update!({ req } as never)).toBe(false)
      expect('access' in enableAPIKeyField && enableAPIKeyField.access?.update).toBeTypeOf(
        'function',
      )
      expect(await enableAPIKeyField.access!.update!({ req } as never)).toBe(false)
    })

    it('should allow applications to further restrict API key management', async () => {
      const apiKey = uuid()
      const user = await payload.create({ collection: apiKeysSlug, data: {} })
      createdAPIKeyIDs.push(user.id)

      const response = await restClient.PATCH(`/${apiKeysSlug}/${user.id}`, {
        body: JSON.stringify({ apiKey, apiKeyIndex: 'attempted override' }),
        headers: { Authorization: `JWT ${fieldDeniedToken}` },
      })
      const storedUser = await payload.db.findOne({
        collection: apiKeysSlug,
        req: { locale: 'en' } as any,
        where: { id: { equals: user.id } },
      })

      expect(response.status).toBe(200)
      expect(storedUser?.apiKeyIndex).not.toBe('attempted override')
      expect(storedUser?.apiKeyIndex).not.toBeTypeOf('string')
    })

    it('should allow an Admin to manage another user API key by default', async () => {
      const apiKey = uuid()

      const response = await restClient.PATCH(`/${adminUsersSlug}/${adminUserIDs[1]}`, {
        body: JSON.stringify({ apiKey }),
        headers: { Authorization: `JWT ${managerToken}` },
      })
      const storedAdmin = await readStoredAdmin(adminUserIDs[1]!)
      await clearStoredAdminKey(adminUserIDs[1]!)

      expect(response.status).toBe(200)
      expect(storedAdmin?.apiKeyIndex).toBeTypeOf('string')
    })

    it('should allow Admin users to manage their own API key', async () => {
      const apiKey = uuid()

      const response = await restClient.PATCH(`/${adminUsersSlug}/${managerID}`, {
        body: JSON.stringify({ apiKey }),
        headers: { Authorization: `JWT ${managerToken}` },
      })
      const storedAdmin = await readStoredAdmin(managerID)
      await clearStoredAdminKey(managerID)

      expect(response.status).toBe(200)
      expect(storedAdmin?.apiKeyIndex).toBeTypeOf('string')
    })
  })

  describe('version restores', () => {
    it('should not restore API key fields from a version', async () => {
      const originalAPIKey = uuid()
      const currentAPIKey = uuid()
      const user = await payload.create({
        collection: apiKeysSlug,
        data: {
          apiKey: originalAPIKey,
          enableAPIKey: true,
          restrictedField: 'original',
        } as any,
      })

      createdAPIKeyIDs.push(user.id)

      await payload.update({
        id: user.id,
        collection: apiKeysSlug,
        data: {
          apiKey: currentAPIKey,
          enableAPIKey: true,
          restrictedField: 'current',
        } as any,
      })

      const versions = await payload.findVersions({
        collection: apiKeysSlug,
        where: {
          parent: {
            equals: user.id,
          },
        },
      })
      const originalVersion = versions.docs.find(
        (version) => version.version.restrictedField === 'original',
      )

      expect(originalVersion).toBeDefined()

      await payload.restoreVersion({
        id: originalVersion!.id,
        collection: apiKeysSlug,
      })

      const restored = await payload.db.findOne({
        collection: apiKeysSlug,
        req: { locale: 'en' } as any,
        where: { id: { equals: user.id } },
      })
      const currentAuthResponse = await restClient.GET(`/${apiKeysSlug}/me`, {
        headers: {
          Authorization: `${apiKeysSlug} API-Key ${currentAPIKey}`,
        },
      })
      const originalAuthResponse = await restClient.GET(`/${apiKeysSlug}/me`, {
        headers: {
          Authorization: `${apiKeysSlug} API-Key ${originalAPIKey}`,
        },
      })

      expect(restored?.restrictedField).toBe('original')
      expect(payload.decrypt(restored?.apiKey as string)).toBe(currentAPIKey)
      expect((await currentAuthResponse.json()).user).toMatchObject({ id: user.id })
      expect((await originalAuthResponse.json()).user).toBeNull()
    })
  })

  describe('API key compatibility', () => {
    let apiKey: string
    let userID: number | string

    beforeEach(async () => {
      apiKey = uuid()
      const user = await payload.create({
        collection: apiKeysSlug,
        data: {
          apiKey,
          enableAPIKey: true,
        } as any,
      })

      userID = user.id
      createdAPIKeyIDs.push(user.id)
    })

    it('should not register a built-in reveal route', async () => {
      const response = await restClient.POST(`/${apiKeysSlug}/${userID}/api-key/reveal`, {
        headers: {
          Authorization: `JWT ${managerToken}`,
        },
      })

      expect(response.status).toBe(404)
    })
  })
})
