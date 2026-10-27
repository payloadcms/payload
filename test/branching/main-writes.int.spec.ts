import type { Payload } from 'payload'

import { expect } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { test } from '../__helpers/int/vitest.js'

import { devUser } from '../credentials.js'

import { postsSlug, uniqueSlug } from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

test.suite('Branching: main-writes', { config: './config.ts', resetBetweenTests: false }, () => {
  test.beforeAll(async ({ payloadInstance, restClientInstance }) => {
    payload = createTrustedPayload(payloadInstance)
    restClient = restClientInstance

    const login = await restClient
      .POST('/users/login', {
        body: JSON.stringify({ email: devUser.email, password: devUser.password }),
      })
      .then((res) => res.json())

    token = login.token
  })

  test.describe('Writes on main', () => {
    const createdIDs: (number | string)[] = []

    test.afterAll(async () => {
      for (const id of createdIDs) {
        await payload.delete({ id, collection: postsSlug })
      }
      createdIDs.length = 0
    })

    test('should stamp documents created without a branch as main', async () => {
      const doc = await payload.create({
        collection: postsSlug,
        data: { title: 'on main' },
      })
      createdIDs.push(doc.id)

      const raw = await payload.db.findOne({
        collection: postsSlug,
        where: { id: { equals: doc.id } },
      })

      expect(raw?._branch).toBe('main')
    })

    test('should still enforce uniqueness within a branch after the index rewrite', async () => {
      const first = await payload.create({
        collection: uniqueSlug,
        data: { slug: 'about' },
      })

      await expect(
        payload.create({ collection: uniqueSlug, data: { slug: 'about' } }),
      ).rejects.toThrow()

      await payload.delete({ id: first.id, collection: uniqueSlug })
    })

    test('should allow several documents without an optional unique value', async () => {
      const first = await payload.create({ collection: uniqueSlug, data: {} })
      const second = await payload.create({ collection: uniqueSlug, data: {} })

      expect(first.id).not.toBe(second.id)

      await payload.delete({ id: first.id, collection: uniqueSlug })
      await payload.delete({ id: second.id, collection: uniqueSlug })
    })
  })
})
