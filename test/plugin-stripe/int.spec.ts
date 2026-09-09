import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { devUser, regularUser } from '../credentials.js'

const stripeMocks = vi.hoisted(() => {
  const customersList = vi.fn()
  const Stripe = vi.fn(function Stripe() {
    return {
      customers: {
        list: customersList,
      },
    }
  })

  return { customersList, Stripe }
})

// The integration test workspace does not declare Stripe, so resolve the same module through the plugin.
vi.mock('../../packages/plugin-stripe/node_modules/stripe', () => ({
  default: stripeMocks.Stripe,
}))

const stripeCustomerList = {
  data: [],
  has_more: false,
  object: 'list',
  url: '/v1/customers',
}

test.suite({ config: './config.ts' })('Stripe Plugin', () => {
  test.beforeEach(() => {
    stripeMocks.Stripe.mockClear()
    stripeMocks.customersList.mockReset()
    stripeMocks.customersList.mockResolvedValue(stripeCustomerList)
  })

  test('should create products', async ({ payload }) => {
    const product = await payload.create({
      collection: 'products',
      data: {
        name: 'Test Product',
      },
    })

    expect(product).toHaveProperty('name', 'Test Product')
  })

  test.describe('REST API proxy', () => {
    test('should deny anonymous requests before invoking Stripe', async ({ restClient }) => {
      const response = await restClient.POST('/stripe/rest', {
        auth: false,
        body: JSON.stringify({ stripeArgs: [{ limit: 2 }], stripeMethod: 'customers.list' }),
      })

      expect(response.status).toBe(401)
      expect(stripeMocks.Stripe).not.toHaveBeenCalled()
      expect(stripeMocks.customersList).not.toHaveBeenCalled()
    })

    test('should deny regular authenticated users before invoking Stripe', async ({
      payload,
      restClient,
    }) => {
      await payload.create({
        collection: 'users',
        data: {
          ...regularUser,
          roles: ['user'],
        },
      })
      const loginResult = await payload.login({
        collection: 'users',
        data: {
          email: regularUser.email,
          password: regularUser.password,
        },
      })

      const response = await restClient.POST('/stripe/rest', {
        auth: false,
        body: JSON.stringify({ stripeArgs: [{ limit: 2 }], stripeMethod: 'customers.list' }),
        headers: {
          Authorization: `JWT ${loginResult.token}`,
        },
      })

      expect(response.status).toBe(403)
      expect(stripeMocks.Stripe).not.toHaveBeenCalled()
      expect(stripeMocks.customersList).not.toHaveBeenCalled()
    })

    test('should allow an admin to invoke an exactly listed Stripe method', async ({
      restClient,
    }) => {
      await restClient.login({ slug: 'users', credentials: devUser })

      const response = await restClient.POST('/stripe/rest', {
        body: JSON.stringify({ stripeArgs: [{ limit: 2 }], stripeMethod: 'customers.list' }),
      })

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ data: stripeCustomerList, status: 200 })
      expect(stripeMocks.Stripe).toHaveBeenCalledExactlyOnceWith('sk_test_123', {
        apiVersion: '2022-08-01',
        appInfo: {
          name: 'Stripe Payload Plugin',
          url: 'https://payloadcms.com',
        },
      })
      expect(stripeMocks.customersList).toHaveBeenCalledExactlyOnceWith({ limit: 2 })
    })

    test('should reject an unlisted Stripe method before invoking Stripe', async ({
      restClient,
    }) => {
      await restClient.login({ slug: 'users', credentials: devUser })

      const response = await restClient.POST('/stripe/rest', {
        body: JSON.stringify({
          stripeArgs: [{ email: 'test@example.com' }],
          stripeMethod: 'customers.create',
        }),
      })

      expect(response.status).toBe(400)
      expect(stripeMocks.Stripe).not.toHaveBeenCalled()
      expect(stripeMocks.customersList).not.toHaveBeenCalled()
    })
  })

  // Test various common webhook events like `product.created`, etc.
  // These could potentially be mocked
  test.todo('should handle incoming Stripe webhook events')

  // Test that the data is synced to Stripe automatically without the use of custom hooks/proxy
  // I.e. the `sync` config option
  test.todo('should auto-sync data based on config')
})
