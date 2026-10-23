import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockCustomersList = vi.fn()
const mockCustomersCreate = vi.fn()
const mockPaymentIntentsCreate = vi.fn()

vi.mock('stripe', () => {
  const MockStripe = function () {
    return {
      customers: {
        create: mockCustomersCreate,
        list: mockCustomersList,
      },
      paymentIntents: {
        create: mockPaymentIntentsCreate,
      },
    }
  }

  return { default: MockStripe }
})

import { initiatePayment } from './initiatePayment.js'

type InitiatePaymentArgs = Parameters<ReturnType<typeof initiatePayment>>[0]

// Stripe rejects metadata values longer than 500 characters.
const STRIPE_METADATA_VALUE_LIMIT = 500

const createCart = (itemCount: number) => ({
  id: 'cart-123',
  items: Array.from({ length: itemCount }, (_, index) => ({
    id: `65f1c0ffee0000000000${String(index).padStart(4, '0')}`,
    product: { id: `65f1c0ffee1111111111${String(index).padStart(4, '0')}` },
    quantity: index + 1,
    variant: `65f1c0ffee2222222222${String(index).padStart(4, '0')}`,
  })),
  subtotal: 12000,
})

const runInitiatePayment = (itemCount: number) => {
  const create = vi.fn().mockResolvedValue({ id: 'txn-123' })
  const req = {
    payload: {
      create,
      logger: { error: vi.fn() },
    },
    user: null,
  } as unknown as InitiatePaymentArgs['req']

  const result = initiatePayment({ secretKey: 'sk_test_123' })({
    data: {
      billingAddress: { city: 'Test City' },
      cart: createCart(itemCount),
      currency: 'USD',
      customerEmail: 'buyer@example.com',
      shippingAddress: { city: 'Test City' },
    },
    req,
    transactionsSlug: 'transactions',
  } as unknown as InitiatePaymentArgs)

  return { create, result }
}

describe('initiatePayment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCustomersList.mockResolvedValue({ data: [{ id: 'cus-123' }] })
    mockPaymentIntentsCreate.mockImplementation((params: { metadata: Record<string, string> }) => {
      for (const [key, value] of Object.entries(params.metadata)) {
        if (typeof value === 'string' && value.length > STRIPE_METADATA_VALUE_LIMIT) {
          return Promise.reject(
            new Error(
              `Metadata values can have up to 500 characters, but you passed in a value that is ${value.length} characters (${key}).`,
            ),
          )
        }
      }

      return Promise.resolve({
        amount: 12000,
        client_secret: 'pi_123_secret',
        currency: 'usd',
        id: 'pi_123',
      })
    })
  })

  it('should keep cart items out of the PaymentIntent metadata', async () => {
    const { create, result } = runInitiatePayment(12)

    await expect(result).resolves.toEqual(
      expect.objectContaining({ clientSecret: 'pi_123_secret', paymentIntentID: 'pi_123' }),
    )

    const [{ metadata }] = mockPaymentIntentsCreate.mock.calls[0]

    expect(metadata).toEqual({
      cartID: 'cart-123',
      shippingAddress: JSON.stringify({ city: 'Test City' }),
    })

    const [{ data: transactionData }] = create.mock.calls[0]

    expect(transactionData.items).toHaveLength(12)
    expect(transactionData.items[0]).toEqual({
      id: '65f1c0ffee00000000000000',
      product: '65f1c0ffee11111111110000',
      quantity: 1,
      variant: '65f1c0ffee22222222220000',
    })
  })
})
