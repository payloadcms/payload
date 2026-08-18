import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Stripe } from 'stripe'

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  customersList: vi.fn(),
  stripeConstructor: vi.fn(),
}))

vi.mock('stripe', () => {
  const MockStripe = function (secretKey: string, config: unknown) {
    mocks.stripeConstructor(secretKey, config)

    return {
      customers: {
        list: mocks.customersList,
      },
      webhooks: {
        constructEvent: mocks.constructEvent,
      },
    }
  }

  return { default: MockStripe }
})

import { stripeAdapter } from './index.js'

const createMockPayload = () => ({
  logger: { error: vi.fn() },
})

describe('Stripe adapter HTTP client', () => {
  const httpClient = { makeRequest: vi.fn() } as Stripe.StripeConfig['httpClient']
  const secretKey = 'sk_test_123'

  beforeEach(() => {
    vi.clearAllMocks()

    mocks.customersList.mockRejectedValue(new Error('stop after Stripe construction'))
    mocks.constructEvent.mockReturnValue({ type: 'payment_intent.succeeded' })
  })

  it('should pass the configured HTTP client when initiating a payment', async () => {
    const adapter = stripeAdapter({
      httpClient,
      publishableKey: 'pk_test_123',
      secretKey,
    })

    await expect(
      adapter.initiatePayment({
        data: {
          cart: {
            id: 'cart-123',
            items: [{ product: 'product-123', quantity: 1 }],
            subtotal: 1000,
          },
          currency: 'USD',
          customerEmail: 'test@example.com',
        },
        req: { payload: createMockPayload() } as any,
        transactionsSlug: 'transactions',
      }),
    ).rejects.toThrow('stop after Stripe construction')

    expect(mocks.stripeConstructor).toHaveBeenCalledWith(
      secretKey,
      expect.objectContaining({ httpClient }),
    )
  })

  it('should preserve the Stripe default when no HTTP client is configured', async () => {
    const adapter = stripeAdapter({
      publishableKey: 'pk_test_123',
      secretKey,
    })

    await expect(
      adapter.initiatePayment({
        data: {
          cart: {
            id: 'cart-123',
            items: [{ product: 'product-123', quantity: 1 }],
            subtotal: 1000,
          },
          currency: 'USD',
          customerEmail: 'test@example.com',
        },
        req: { payload: createMockPayload() } as any,
        transactionsSlug: 'transactions',
      }),
    ).rejects.toThrow('stop after Stripe construction')

    expect(mocks.stripeConstructor.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({ httpClient: undefined }),
    )
  })

  it('should pass the configured HTTP client when confirming an order', async () => {
    const adapter = stripeAdapter({
      httpClient,
      publishableKey: 'pk_test_123',
      secretKey,
    })

    await expect(
      adapter.confirmOrder({
        data: {
          customerEmail: 'test@example.com',
          paymentIntentID: 'pi_123',
        },
        req: { payload: createMockPayload() } as any,
      }),
    ).rejects.toThrow('stop after Stripe construction')

    expect(mocks.stripeConstructor).toHaveBeenCalledWith(
      secretKey,
      expect.objectContaining({ httpClient }),
    )
  })

  it('should pass the configured HTTP client when handling webhooks', async () => {
    const adapter = stripeAdapter({
      httpClient,
      publishableKey: 'pk_test_123',
      secretKey,
      webhookSecret: 'whsec_123',
    })
    const webhookEndpoint = adapter.endpoints?.[0]

    await webhookEndpoint?.handler({
      headers: new Headers({ 'stripe-signature': 'signature' }),
      payload: createMockPayload(),
      text: vi.fn().mockResolvedValue('{}'),
    } as any)

    expect(mocks.stripeConstructor).toHaveBeenCalledWith(
      secretKey,
      expect.objectContaining({ httpClient }),
    )
  })
})
