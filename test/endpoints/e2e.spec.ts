import { expect, test } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatAdminURL } from 'payload/shared'

import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { collectionSlug, customAPIRoute } from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

test.describe('Endpoints', () => {
  let serverURL: string

  test.beforeAll(async () => {
    ;({ serverURL } = await initPayloadE2ENoConfig({ dirname }))
  })

  test('should handle REST requests under a custom API route', async ({ request }) => {
    const response = await request.get(
      formatAdminURL({ apiRoute: customAPIRoute, path: `/${collectionSlug}`, serverURL }),
    )

    expect(response.status()).toBe(200)

    const result = await response.json()

    expect(result.docs).toEqual(expect.any(Array))
  })
})
