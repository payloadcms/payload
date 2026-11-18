import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockCustomersList = vi.fn()
const mockCustomersCreate = vi.fn()
const mockPaymentIntentsCreate = vi.fn()

vi.mock('stripe', () => {
  const MockStripe = function () {
    return {
      customers: {
        list: mockCustomersList,
        create: mockCustomersCreate,
      },
      paymentIntents: {
        create: mockPaymentIntentsCreate,
      },
    }
  }

  return { default: MockStripe }
})

import { initiatePayment } from './initiatePayment'

const cart = {
  id: 'cart-123',
  items: [{ product: 'product-1', quantity: 1 }],
  subtotal: 1000,
}

const createMockPayload = () => ({
  create: vi.fn().mockResolvedValue({ id: 'transaction-123' }),
  logger: { error: vi.fn() },
})

describe('stripe initiatePayment - customer vs non-customer users', () => {
  const secretKey = 'sk_test_123'

  beforeEach(() => {
    vi.clearAllMocks()

    mockCustomersList.mockResolvedValue({ data: [{ id: 'cus-123' }] })
    mockPaymentIntentsCreate.mockResolvedValue({
      id: 'pi-123',
      amount: 1000,
      client_secret: 'secret',
      currency: 'usd',
    })
  })

  it('should attach `customer` when req.user belongs to the customers collection', async () => {
    const payload = createMockPayload()
    const req = {
      payload,
      user: { id: 'user-1', collection: 'users' },
    } as any

    await initiatePayment({ secretKey })({
      customersSlug: 'users',
      data: {
        billingAddress: undefined,
        cart,
        currency: 'usd',
        customerEmail: 'customer@example.com',
      },
      req,
      transactionsSlug: 'transactions',
    })

    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ customer: 'user-1' }),
      }),
    )
  })

  it('should attach `customerEmail` instead of `customer` when req.user is from a non-customer collection', async () => {
    const payload = createMockPayload()
    const req = {
      payload,
      user: { id: 'api-key-1', collection: 'api-keys' },
    } as any

    await initiatePayment({ secretKey })({
      customersSlug: 'users',
      data: {
        billingAddress: undefined,
        cart,
        currency: 'usd',
        customerEmail: 'guest@example.com',
      },
      req,
      transactionsSlug: 'transactions',
    })

    const writtenData = payload.create.mock.calls[0]?.[0]?.data

    expect(writtenData.customer).toBeUndefined()
    expect(writtenData.customerEmail).toBe('guest@example.com')
  })
})
