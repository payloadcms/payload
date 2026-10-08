import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
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

let payload: Payload
let regularUserToken: string
let restClient: NextRESTClient

const stripeCustomerList = {
  data: [],
  has_more: false,
  object: 'list',
  url: '/v1/customers',
}

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Stripe Plugin', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))

    await restClient.login({
      slug: 'users',
      credentials: devUser,
    })

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

    regularUserToken = loginResult.token
  })

  afterAll(async () => {
    await payload.delete({
      collection: 'users',
      where: {
        email: {
          equals: regularUser.email,
        },
      },
    })

    await payload.destroy()
  })

  beforeEach(() => {
    stripeMocks.Stripe.mockClear()
    stripeMocks.customersList.mockReset()
    stripeMocks.customersList.mockResolvedValue(stripeCustomerList)
  })

  it('should create products', async () => {
    const product = await payload.create({
      collection: 'products',
      data: {
        name: 'Test Product',
      },
    })

    expect(product).toHaveProperty('name', 'Test Product')
  })

  describe('REST API proxy', () => {
    // Mutation caught: allowing the real endpoint to authenticate anonymous requests.
    it('should deny anonymous requests before invoking Stripe', async () => {
      const response = await restClient.POST('/stripe/rest', {
        auth: false,
        body: JSON.stringify({ stripeArgs: [{ limit: 2 }], stripeMethod: 'customers.list' }),
      })

      expect(response.status).toBe(401)
      expect(stripeMocks.Stripe).not.toHaveBeenCalled()
      expect(stripeMocks.customersList).not.toHaveBeenCalled()
    })

    // Mutation caught: treating any authenticated user as an administrator on the real endpoint.
    it('should deny regular authenticated users before invoking Stripe', async () => {
      const response = await restClient.POST('/stripe/rest', {
        auth: false,
        body: JSON.stringify({ stripeArgs: [{ limit: 2 }], stripeMethod: 'customers.list' }),
        headers: {
          Authorization: `JWT ${regularUserToken}`,
        },
      })

      expect(response.status).toBe(403)
      expect(stripeMocks.Stripe).not.toHaveBeenCalled()
      expect(stripeMocks.customersList).not.toHaveBeenCalled()
    })

    // Mutation caught: rejecting an exact allowlisted method after the real admin access check succeeds.
    it('should allow an admin to invoke an exactly listed Stripe method', async () => {
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

    // Mutation caught: forwarding an unlisted method through the real endpoint to Stripe.
    it('should reject an unlisted Stripe method with a generic response before invoking Stripe', async () => {
      const response = await restClient.POST('/stripe/rest', {
        body: JSON.stringify({
          stripeArgs: [{ email: 'test@example.com' }],
          stripeMethod: 'customers.create',
        }),
      })

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ message: 'Invalid request' })
      expect(stripeMocks.Stripe).not.toHaveBeenCalled()
      expect(stripeMocks.customersList).not.toHaveBeenCalled()
    })
  })

  // Test various common webhook events like `product.created`, etc.
  // These could potentially be mocked
  it.todo('should handle incoming Stripe webhook events')

  // Test that the data is synced to Stripe automatically without the use of custom hooks/proxy
  // I.e. the `sync` config option
  it.todo('should auto-sync data based on config')
})
