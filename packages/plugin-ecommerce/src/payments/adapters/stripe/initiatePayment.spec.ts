import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockCustomersList = vi.fn()
const mockPaymentIntentsCreate = vi.fn()

vi.mock('stripe', () => {
  const MockStripe = function () {
    return {
      customers: {
        create: vi.fn(),
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

const createItems = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `item-${index}`,
    product: `product-${index}`,
    quantity: 1,
  }))

describe('initiatePayment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCustomersList.mockResolvedValue({ data: [{ id: 'cus-123' }] })
    mockPaymentIntentsCreate.mockResolvedValue({
      amount: 1000,
      client_secret: 'secret-123',
      currency: 'usd',
      id: 'pi_123',
    })
  })

  it('should keep every metadata value under the Stripe limit for a large cart', async () => {
    const items = createItems(30)
    const create = vi.fn().mockResolvedValue({ id: 'txn-123' })
    const req = {
      payload: { create, logger: { error: vi.fn() } },
      user: null,
    } as unknown as InitiatePaymentArgs['req']

    await initiatePayment({ secretKey: 'sk_test_123' })({
      data: {
        cart: { id: 'cart-123', items, subtotal: 1000 },
        currency: 'usd',
        customerEmail: 'buyer@example.com',
        shippingAddress: { city: 'Test City' },
      },
      req,
      transactionsSlug: 'transactions',
    } as unknown as InitiatePaymentArgs)

    const { metadata } = mockPaymentIntentsCreate.mock.calls[0][0]

    expect(metadata.cartItemsSnapshot).toBeUndefined()
    for (const value of Object.values<string>(metadata)) {
      expect(value.length).toBeLessThanOrEqual(500)
    }
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ items }) }),
    )
  })
})
