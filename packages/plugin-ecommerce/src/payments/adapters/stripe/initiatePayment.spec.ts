import { describe, expect, it, vi } from 'vitest'

import { initiatePayment } from './initiatePayment.js'

const mockPaymentIntentsCreate = vi.fn().mockResolvedValue({
  amount: 3000,
  client_secret: 'pi_secret_test',
  currency: 'usd',
  id: 'pi_test_123',
})

vi.mock('stripe', () => {
  return {
    default: class StripeMock {
      customers = {
        create: vi.fn().mockResolvedValue({ id: 'cus_test_123' }),
        list: vi.fn().mockResolvedValue({ data: [{ id: 'cus_test_123' }] }),
      }

      paymentIntents = {
        create: mockPaymentIntentsCreate,
      }
    },
  }
})

const baseData = {
  billingAddress: {} as any,
  cart: {
    id: 'cart_1',
    items: [{ id: 'item_1', product: 'prod_1', quantity: 1 }],
    subtotal: 3000,
  },
  currency: 'usd',
  customerEmail: 'test@example.com',
}

const baseArgs = {
  customersSlug: 'users',
  req: {
    payload: {
      create: vi.fn().mockResolvedValue({}),
      logger: { error: vi.fn() },
    },
    user: { id: 'user_1' },
  } as any,
  transactionsSlug: 'transactions',
}

describe('initiatePayment - amount override', () => {
  it('should use cart.subtotal when no amount override is provided', async () => {
    mockPaymentIntentsCreate.mockClear()

    const handler = initiatePayment({ secretKey: 'sk_test_123' })

    await handler({
      ...baseArgs,
      data: { ...baseData },
    })

    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 3000,
      }),
    )
  })

  it('should use data.amount when provided', async () => {
    mockPaymentIntentsCreate.mockClear()

    const handler = initiatePayment({ secretKey: 'sk_test_123' })

    await handler({
      ...baseArgs,
      data: { ...baseData, amount: 5500 },
    })

    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 5500,
      }),
    )
  })
})
