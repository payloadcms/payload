import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockStripeConstructor, mockStripeResources } = vi.hoisted(() => ({
  mockStripeConstructor: vi.fn(),
  mockStripeResources: {
    subscriptions: {} as Record<string, unknown>,
  },
}))

vi.mock('stripe', () => ({
  default: class MockStripe {
    subscriptions = mockStripeResources.subscriptions

    constructor(secretKey: string, config: unknown) {
      mockStripeConstructor(secretKey, config)
    }
  },
}))

import { stripeProxy } from './stripeProxy.js'

describe('stripeProxy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStripeResources.subscriptions = {}
  })

  it('should call a valid Stripe method with its resource context', async () => {
    const mockList = vi.fn(function (this: { resource: string }, ...args: unknown[]) {
      return Promise.resolve({ args, resource: this.resource })
    })
    const subscriptions = {
      list: mockList,
      resource: 'subscriptions',
    }

    mockStripeResources.subscriptions = subscriptions

    const result = await stripeProxy({
      stripeArgs: [{ limit: 2 }],
      stripeMethod: 'subscriptions.list',
      stripeSecretKey: 'sk_test_example',
    })

    expect(mockStripeConstructor).toHaveBeenCalledWith(
      'sk_test_example',
      expect.objectContaining({ apiVersion: '2022-08-01' }),
    )
    expect(mockList).toHaveBeenCalledWith({ limit: 2 })
    expect(mockList.mock.contexts[0]).toBe(subscriptions)
    expect(result).toEqual({
      data: { args: [{ limit: 2 }], resource: 'subscriptions' },
      status: 200,
    })
  })

  it('should throw an explanatory error for an unknown Stripe method', async () => {
    await expect(
      stripeProxy({
        stripeArgs: [],
        stripeMethod: 'subscriptions.unknown',
        stripeSecretKey: 'sk_test_example',
      }),
    ).rejects.toThrow(
      "The provided Stripe method of 'subscriptions.unknown' is not a part of the Stripe API.",
    )
  })

  it('should reject non-array Stripe arguments', async () => {
    const mockList = vi.fn()

    mockStripeResources.subscriptions = { list: mockList }

    await expect(
      stripeProxy({
        stripeArgs: { limit: 2 } as unknown as unknown[],
        stripeMethod: 'subscriptions.list',
        stripeSecretKey: 'sk_test_example',
      }),
    ).rejects.toThrow("Argument 'stripeArgs' must be an array.")
    expect(mockList).not.toHaveBeenCalled()
  })
})
