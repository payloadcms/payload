import { handleAPIRoute } from '@payloadcms/tanstack-start/server'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { collectionSlug, customAPIRoute } from './shared.js'

test.suite('TanStack Start endpoints', { config: './config.ts' }, () => {
  test('should handle REST requests under a custom API route', async ({ payload }) => {
    const response = await handleAPIRoute({
      config: payload.config,
      request: new Request(`http://localhost${customAPIRoute}/${collectionSlug}`),
    })

    expect(response.status).toBe(200)

    const result = await response.json()

    expect(result.docs).toEqual(expect.any(Array))
  })
})
