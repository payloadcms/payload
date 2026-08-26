import type { Payload } from 'payload'

import path from 'path'
import { createLocalReq } from 'payload'
import { getEntityPermissions } from 'payload/internal'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { devUser } from '../credentials.js'
import { slug } from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

describe('API key permissions', () => {
  let payload: Payload

  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
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
})
