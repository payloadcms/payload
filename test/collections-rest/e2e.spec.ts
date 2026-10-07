import { expect, test } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { postsSlug } from './config.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

test.describe('Collections REST', () => {
  let serverURL: string

  test.beforeAll(async () => {
    ;({ serverURL } = await initPayloadE2ENoConfig({ dirname }))
  })

  test('should handle REST requests under a custom API route', async ({ request }) => {
    const enableResponse = await request.post(`${serverURL}/api/enable-custom-api-route`)

    expect(enableResponse.ok()).toBe(true)

    try {
      const response = await request.get(`${serverURL}/custom-api/${postsSlug}`)

      expect(response.status()).toBe(200)

      const result = await response.json()

      expect(result.docs).toEqual(expect.any(Array))
    } finally {
      await request.post(`${serverURL}/custom-api/restore-api-route`)
    }
  })
})
