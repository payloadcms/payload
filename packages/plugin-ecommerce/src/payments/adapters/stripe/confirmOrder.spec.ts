import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockCustomersList = vi.fn()
const mockCustomersCreate = vi.fn()
const mockPaymentIntentsRetrieve = vi.fn()

vi.mock('stripe', () => {
  const MockStripe = function () {
    return {
      customers: {
        list: mockCustomersList,
        create: mockCustomersCreate,
      },
      paymentIntents: {
        retrieve: mockPaymentIntentsRetrieve,
      },
    }
  }

  return { default: MockStripe }
})

import { confirmOrder } from './confirmOrder'

const defaultCartItemsSnapshot = JSON.stringify([{ id: 'item-1', quantity: 1 }])

const createMockPaymentIntent = (status: string) => ({
  amount: 1000,
  currency: 'usd',
  metadata: {
    cartID: 'cart-123',
    cartItemsSnapshot: defaultCartItemsSnapshot,
    shippingAddress: JSON.stringify({ city: 'Test City' }),
  },
  status,
})

const createMockPayload = () => ({
  create: vi.fn().mockResolvedValue({ id: 'order-123' }),
  find: vi.fn().mockResolvedValue({
    docs: [{ id: 'txn-123' }],
    totalDocs: 1,
  }),
  logger: { error: vi.fn() },
  update: vi.fn().mockResolvedValue({}),
})

const createMockReq = (payload: ReturnType<typeof createMockPayload>) =>
  ({
    payload,
    user: { id: 'user-123' },
  }) as any

describe('confirmOrder - payment status check', () => {
  const secretKey = 'sk_test_123'

  beforeEach(() => {
    vi.clearAllMocks()

    mockCustomersList.mockResolvedValue({ data: [{ id: 'cus-123' }] })
    mockCustomersCreate.mockResolvedValue({ id: 'cus-new' })
  })

  it('should throw when paymentIntent status is requires_payment_method', async () => {
    mockPaymentIntentsRetrieve.mockResolvedValue(createMockPaymentIntent('requires_payment_method'))

    const mockPayload = createMockPayload()
    const handler = confirmOrder({ secretKey })

    await expect(
      handler({
        data: { customerEmail: 'test@test.com', paymentIntentID: 'pi_123' },
        req: createMockReq(mockPayload),
      }),
    ).rejects.toThrow('Payment not completed.')

    expect(mockPayload.create).not.toHaveBeenCalled()
  })

  it('should throw when paymentIntent status is canceled', async () => {
    mockPaymentIntentsRetrieve.mockResolvedValue(createMockPaymentIntent('canceled'))

    const mockPayload = createMockPayload()
    const handler = confirmOrder({ secretKey })

    await expect(
      handler({
        data: { customerEmail: 'test@test.com', paymentIntentID: 'pi_123' },
        req: createMockReq(mockPayload),
      }),
    ).rejects.toThrow('Payment not completed.')

    expect(mockPayload.create).not.toHaveBeenCalled()
  })

  it('should throw when paymentIntent status is processing', async () => {
    mockPaymentIntentsRetrieve.mockResolvedValue(createMockPaymentIntent('processing'))

    const mockPayload = createMockPayload()
    const handler = confirmOrder({ secretKey })

    await expect(
      handler({
        data: { customerEmail: 'test@test.com', paymentIntentID: 'pi_123' },
        req: createMockReq(mockPayload),
      }),
    ).rejects.toThrow('Payment not completed.')

    expect(mockPayload.create).not.toHaveBeenCalled()
  })

  it('should not update cart or transaction when payment has not succeeded', async () => {
    mockPaymentIntentsRetrieve.mockResolvedValue(createMockPaymentIntent('requires_payment_method'))

    const mockPayload = createMockPayload()
    const handler = confirmOrder({ secretKey })

    await expect(
      handler({
        data: { customerEmail: 'test@test.com', paymentIntentID: 'pi_123' },
        req: createMockReq(mockPayload),
      }),
    ).rejects.toThrow()

    expect(mockPayload.update).not.toHaveBeenCalled()
  })

  it('should create order when paymentIntent status is succeeded', async () => {
    mockPaymentIntentsRetrieve.mockResolvedValue(createMockPaymentIntent('succeeded'))

    const mockPayload = createMockPayload()
    const handler = confirmOrder({ secretKey })

    const result = await handler({
      data: { customerEmail: 'test@test.com', paymentIntentID: 'pi_123' },
      req: createMockReq(mockPayload),
    })

    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'orders',
        data: expect.objectContaining({
          amount: 1000,
          currency: 'USD',
          status: 'processing',
        }),
      }),
    )

    expect(result).toEqual(
      expect.objectContaining({
        orderID: 'order-123',
        transactionID: 'txn-123',
      }),
    )
  })
})
