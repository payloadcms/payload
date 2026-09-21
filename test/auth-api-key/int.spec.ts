import { v4 as uuid } from 'uuid'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import {
  apiKeysSlug,
  restrictedRevealableKeysSlug,
  revealableKeysSlug,
  tenantRevealableKeysSlug,
  usersSlug,
} from './shared.js'

test.suite('API key reveal access', { config: './config.ts' }, () => {
  const loginAdmin = async ({ restClient }) => {
    await restClient.login({
      slug: usersSlug,
      credentials: { email: devUser.email, password: devUser.password },
    })
  }

  test('should not backfill recognizable characters from short API keys', async ({ payload }) => {
    const apiKey = 'short-key'
    const result = await payload.create({
      collection: apiKeysSlug,
      data: { apiKey },
    })
    const originalUpdateOne = payload.db.updateOne
    let backfillCount = 0

    payload.db.updateOne = async (args) => {
      if (args.collection === apiKeysSlug && 'apiKeyLast4' in args.data) {
        backfillCount++
      }

      return originalUpdateOne.call(payload.db, args)
    }

    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        const { user } = await payload.auth({
          headers: new Headers({ Authorization: `${apiKeysSlug} API-Key ${apiKey}` }),
        })

        expect(user?.id).toBe(result.id)
      }
    } finally {
      payload.db.updateOne = originalUpdateOne
    }

    expect(result.apiKeyLast4).toBe('••••')
    expect(backfillCount).toBe(0)
  })

  test('should revoke API keys for submitted invalid or empty values', async ({ payload }) => {
    for (const apiKeyValue of [null, '', 0, true, {}, []]) {
      const user = await payload.create({ collection: apiKeysSlug, data: { apiKey: uuid() } })

      await payload.update({
        id: user.id,
        collection: apiKeysSlug,
        data: { apiKey: apiKeyValue } as never,
      })

      const storedUser = await payload.db.findOne({
        collection: apiKeysSlug,
        req: {} as never,
        where: { id: { equals: user.id } },
      })

      expect(storedUser?.apiKey).toBeNull()
      expect(storedUser?.apiKeyIndex).toBeNull()
      expect(storedUser?.apiKeyLast4).toBeNull()
    }
  })

  test('should preserve API key fields for explicitly undefined values', async ({ payload }) => {
    const apiKey = uuid()
    const user = await payload.create({ collection: apiKeysSlug, data: { apiKey } })

    await payload.update({
      id: user.id,
      collection: apiKeysSlug,
      data: { apiKey: undefined } as never,
    })

    const storedUser = await payload.db.findOne({
      collection: apiKeysSlug,
      req: {} as never,
      where: { id: { equals: user.id } },
    })

    expect(payload.decrypt(storedUser?.apiKey as string)).toBe(apiKey)
    expect(storedUser?.apiKeyIndex).toBeTypeOf('string')
    expect(storedUser?.apiKeyLast4).toBe(apiKey.slice(-4))
  })

  test('should not inject the reveal endpoint by default', async ({ payload, restClient }) => {
    await loginAdmin({ payload, restClient })
    const apiKeyUser = await payload.create({ collection: apiKeysSlug, data: { apiKey: uuid() } })
    const response = await restClient.POST(`/${apiKeysSlug}/${apiKeyUser.id}/api-key/reveal`)

    expect(response.status).toBe(404)
  })

  test('should reject unauthenticated reveal requests', async ({ restClient }) => {
    const response = await restClient.POST(`/${revealableKeysSlug}/example/api-key/reveal`, {
      auth: false,
    })

    expect(response.status).toBe(403)
  })

  test('should reject authenticated users without admin access', async ({
    payload,
    restClient,
  }) => {
    const apiKey = uuid()
    await payload.create({ collection: apiKeysSlug, data: { apiKey } })
    const revealableKey = await payload.create({
      collection: revealableKeysSlug,
      data: { apiKey: uuid() },
    })

    const response = await restClient.POST(
      `/${revealableKeysSlug}/${revealableKey.id}/api-key/reveal`,
      {
        auth: false,
        headers: { Authorization: `${apiKeysSlug} API-Key ${apiKey}` },
      },
    )

    expect(response.status).toBe(403)
  })

  test('should not reveal a key for a document outside collection read access', async ({
    payload,
    restClient,
  }) => {
    await loginAdmin({ payload, restClient })
    const revealableKey = await payload.create({
      collection: restrictedRevealableKeysSlug,
      data: { apiKey: uuid(), denyCollectionReadAccess: true },
    })
    const response = await restClient.POST(
      `/${restrictedRevealableKeysSlug}/${revealableKey.id}/api-key/reveal`,
    )

    expect(response.status).toBe(404)
  })

  test('should respect the API key update access override when revealing', async ({
    payload,
    restClient,
  }) => {
    await loginAdmin({ payload, restClient })
    const revealableKey = await payload.create({
      collection: restrictedRevealableKeysSlug,
      data: { apiKey: uuid(), denyAPIKeyUpdateAccess: true },
    })
    const response = await restClient.POST(
      `/${restrictedRevealableKeysSlug}/${revealableKey.id}/api-key/reveal`,
    )

    expect(response.status).toBe(403)
  })

  test('should pass an access-filtered document to API key update access', async ({
    payload,
    restClient,
  }) => {
    await loginAdmin({ payload, restClient })
    const apiKey = uuid()
    const revealableKey = await payload.create({
      collection: restrictedRevealableKeysSlug,
      data: { apiKey },
    })
    const response = await restClient.POST(
      `/${restrictedRevealableKeysSlug}/${revealableKey.id}/api-key/reveal`,
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({ apiKey })
  })

  test('should evaluate data-based collection update access against the stored document', async ({
    payload,
    restClient,
  }) => {
    await loginAdmin({ payload, restClient })
    const apiKey = uuid()
    const matching = await payload.create({
      collection: tenantRevealableKeysSlug,
      data: { apiKey, tenant: 'match' } as never,
    })
    const mismatched = await payload.create({
      collection: tenantRevealableKeysSlug,
      data: { apiKey: uuid(), tenant: 'other' } as never,
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

  test('should not reveal a key without collection update access', async ({
    payload,
    restClient,
  }) => {
    await loginAdmin({ payload, restClient })
    const revealableKey = await payload.create({
      collection: restrictedRevealableKeysSlug,
      data: { apiKey: uuid(), denyCollectionUpdateAccess: true },
    })
    const response = await restClient.POST(
      `/${restrictedRevealableKeysSlug}/${revealableKey.id}/api-key/reveal`,
    )

    expect(response.status).toBe(403)
  })
})
