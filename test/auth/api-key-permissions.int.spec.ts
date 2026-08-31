import type { Payload } from 'payload'

import path from 'path'
import { createLocalReq } from 'payload'
import { getEntityPermissions } from 'payload/internal'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { devUser } from '../credentials.js'
import {
  apiKeysWithReadableKeysSlug,
  apiKeysWithRestrictedFieldAccessSlug,
  slug,
} from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

describe('API key permissions', () => {
  const createdReadableAPIKeyIDs: Array<number | string> = []
  const createdRestrictedAPIKeyIDs: Array<number | string> = []
  let payload: Payload

  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  afterEach(async () => {
    for (const id of createdReadableAPIKeyIDs) {
      await payload.delete({
        collection: apiKeysWithReadableKeysSlug,
        where: { id: { equals: id } },
      })
    }

    for (const id of createdRestrictedAPIKeyIDs) {
      await payload.delete({
        collection: apiKeysWithRestrictedFieldAccessSlug,
        where: { id: { equals: id } },
      })
    }

    createdReadableAPIKeyIDs.length = 0
    createdRestrictedAPIKeyIDs.length = 0
  })

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
