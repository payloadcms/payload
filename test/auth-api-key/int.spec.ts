import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import {
  apiKeysSlug,
  restrictedRevealableKeysSlug,
  revealableKeysSlug,
  tenantRevealableKeysSlug,
  usersSlug,
} from './shared.js'

let payload: Payload
let restClient: NextRESTClient

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('API key reveal access', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
    await restClient.login({ slug: usersSlug })
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('should not reveal a key for a document outside collection read access', async () => {
    const revealableKey = await payload.create({
      collection: restrictedRevealableKeysSlug,
      data: {
        apiKey: uuid(),
        denyCollectionReadAccess: true,
      },
    })

    const response = await restClient.POST(
      `/${restrictedRevealableKeysSlug}/${revealableKey.id}/api-key/reveal`,
    )

    expect(response.status).toBe(404)
  })

  it('should reject authenticated users without admin access', async () => {
    const apiKey = uuid()
    await payload.create({
      collection: apiKeysSlug,
      data: { apiKey },
    })
    const revealableKey = await payload.create({
      collection: revealableKeysSlug,
      data: { apiKey: uuid() },
    })

    const response = await restClient.POST(
      `/${revealableKeysSlug}/${revealableKey.id}/api-key/reveal`,
      {
        auth: false,
        headers: {
          Authorization: `${apiKeysSlug} API-Key ${apiKey}`,
        },
      },
    )

    expect(response.status).toBe(403)
  })

  it('should respect the API key update access override when revealing', async () => {
    const revealableKey = await payload.create({
      collection: restrictedRevealableKeysSlug,
      data: {
        apiKey: uuid(),
        denyAPIKeyUpdateAccess: true,
      },
    })

    const response = await restClient.POST(
      `/${restrictedRevealableKeysSlug}/${revealableKey.id}/api-key/reveal`,
    )

    expect(response.status).toBe(403)
  })

  it('should pass an access-filtered document to API key update access', async () => {
    const apiKey = uuid()
    const revealableKey = await payload.create({
      collection: restrictedRevealableKeysSlug,
      data: {
        apiKey,
      },
    })

    const response = await restClient.POST(
      `/${restrictedRevealableKeysSlug}/${revealableKey.id}/api-key/reveal`,
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ apiKey })
  })

  it('should evaluate data-based collection update access against the stored document', async () => {
    const apiKey = uuid()
    const matching = await payload.create({
      collection: tenantRevealableKeysSlug,
      data: { apiKey, tenant: 'match' },
    })
    const mismatched = await payload.create({
      collection: tenantRevealableKeysSlug,
      data: { apiKey: uuid(), tenant: 'other' },
    })

    const allowed = await restClient.POST(
      `/${tenantRevealableKeysSlug}/${matching.id}/api-key/reveal`,
    )
    const denied = await restClient.POST(
      `/${tenantRevealableKeysSlug}/${mismatched.id}/api-key/reveal`,
    )

    expect(allowed.status).toBe(200)
    await expect(allowed.json()).resolves.toEqual({ apiKey })
    expect(denied.status).toBe(403)
  })

  it('should not reveal a key without collection update access', async () => {
    const revealableKey = await payload.create({
      collection: restrictedRevealableKeysSlug,
      data: {
        apiKey: uuid(),
        denyCollectionUpdateAccess: true,
      },
    })

    const response = await restClient.POST(
      `/${restrictedRevealableKeysSlug}/${revealableKey.id}/api-key/reveal`,
    )

    expect(response.status).toBe(403)
  })
})
