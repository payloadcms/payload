import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'

test.suite({ config: './config.ts' })('Stripe Plugin', () => {
  test('should create products', async ({ payload }) => {
    const product = await payload.create({
      collection: 'products',
      data: {
        name: 'Test Product',
      },
    })

    expect(product).toHaveProperty('name', 'Test Product')
  })

  // Test various common API calls like `products.create`, etc.
  // Send the requests through the Payload->Stripe proxy
  // Query Stripe directly to ensure the data is as expected
  test.todo('should open REST API proxy')

  // Test various common webhook events like `product.created`, etc.
  // These could potentially be mocked
  test.todo('should handle incoming Stripe webhook events')

  // Test that the data is synced to Stripe automatically without the use of custom hooks/proxy
  // I.e. the `sync` config option
  test.todo('should auto-sync data based on config')
})
