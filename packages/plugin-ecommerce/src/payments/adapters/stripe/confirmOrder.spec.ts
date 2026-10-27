import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockPaymentIntentsRetrieve = vi.fn()

vi.mock('stripe', () => {
  const MockStripe = function () {
    return {
      paymentIntents: {
        retrieve: mockPaymentIntentsRetrieve,
      },
    }
  }

  return { default: MockStripe }
})

import { confirmOrder } from './confirmOrder.js'

type ConfirmOrderArgs = Parameters<ReturnType<typeof confirmOrder>>[0]

const createTransaction = (overrides: Record<string, unknown> = {}) => ({
  amount: 1000,
  cart: 'cart-123',
  currency: 'USD',
  customer: 'user-123',
  id: 'txn-123',
  items: [{ id: 'item-1', product: 'product-123', quantity: 1 }],
  order: undefined,
  status: 'pending',
  stripe: {
    customerID: 'cus-123',
    paymentIntentID: 'pi_123',
  },
  ...overrides,
})

const createPaymentIntent = (overrides: Record<string, unknown> = {}) => ({
  amount: 1000,
  currency: 'usd',
  customer: 'cus-123',
  id: 'pi_123',
  metadata: {
    cartID: 'cart-123',
    cartItemsSnapshot: JSON.stringify([{ id: 'item-1', product: 'product-123', quantity: 1 }]),
    shippingAddress: JSON.stringify({ city: 'Test City' }),
  },
  status: 'succeeded',
  ...overrides,
})

const createHarness = ({
  transaction = createTransaction(),
  transactionCopies = 1,
  user = { id: 'user-123' } as null | Record<string, unknown>,
}: {
  transaction?: Record<string, unknown>
  transactionCopies?: number
  user?: null | Record<string, unknown>
} = {}) => {
  const find = vi.fn().mockResolvedValue({
    docs: Array.from({ length: transactionCopies }, () => transaction),
    totalDocs: transactionCopies,
  })
  const loggerError = vi.fn()
  const finalizeOrder = vi.fn().mockResolvedValue({ accessToken: 'access-123', id: 'order-123' })
  const req = {
    payload: {
      find,
      logger: { error: loggerError },
    },
    user,
  } as unknown as ConfirmOrderArgs['req']

  return { finalizeOrder, find, loggerError, req }
}

const runConfirmation = ({
  data = {},
  harness,
}: {
  data?: Record<string, unknown>
  harness: ReturnType<typeof createHarness>
}) =>
  confirmOrder({ secretKey: 'sk_test_123' })({
    data: {
      cartID: 'cart-123',
      customerEmail: 'buyer@example.com',
      paymentIntentID: 'pi_123',
      ...data,
    },
    finalizeOrder: harness.finalizeOrder,
    req: harness.req,
  })

describe('confirmOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPaymentIntentsRetrieve.mockResolvedValue(createPaymentIntent())
  })

  it('should delegate provider-validated settlement data to the core finalizer', async () => {
    const harness = createHarness()

    const result = await runConfirmation({ harness })

    expect(harness.finalizeOrder).toHaveBeenCalledWith({
      orderData: {
        amount: 1000,
        currency: 'USD',
        customer: 'user-123',
        items: [{ id: 'item-1', product: 'product-123', quantity: 1 }],
        shippingAddress: { city: 'Test City' },
        status: 'processing',
      },
      transactionID: 'txn-123',
    })
    expect(result).toEqual({
      accessToken: 'access-123',
      message: 'Payment initiated successfully',
      orderID: 'order-123',
      transactionID: 'txn-123',
    })
  })

  it('should return the transaction ID again when the core finalizer returns an existing order', async () => {
    const harness = createHarness()
    harness.finalizeOrder.mockResolvedValue({
      accessToken: 'existing-access',
      id: 'existing-order',
    })

    const result = await runConfirmation({ harness })

    expect(result).toEqual({
      accessToken: 'existing-access',
      message: 'Payment initiated successfully',
      orderID: 'existing-order',
      transactionID: 'txn-123',
    })
  })

  it('should delegate guest order ownership using the validated email', async () => {
    const harness = createHarness({
      transaction: createTransaction({
        customer: undefined,
        customerEmail: 'buyer@example.com',
        stripe: {
          customerID: 'cus-guest',
          paymentIntentID: 'pi_123',
        },
      }),
      user: null,
    })
    mockPaymentIntentsRetrieve.mockResolvedValue(createPaymentIntent({ customer: 'cus-guest' }))

    await runConfirmation({ harness })

    expect(harness.finalizeOrder).toHaveBeenCalledWith({
      orderData: expect.objectContaining({ customerEmail: 'buyer@example.com' }),
      transactionID: 'txn-123',
    })
  })

  it.each(['requires_payment_method', 'canceled', 'processing'])(
    'should reject a PaymentIntent with %s status before finalization',
    async (status) => {
      const harness = createHarness()
      mockPaymentIntentsRetrieve.mockResolvedValue(createPaymentIntent({ status }))

      await expect(runConfirmation({ harness })).rejects.toThrow('Payment not completed.')

      expect(harness.finalizeOrder).not.toHaveBeenCalled()
    },
  )

  it('should reject multiple matching transactions before finalization', async () => {
    const harness = createHarness({ transactionCopies: 2 })

    await expect(runConfirmation({ harness })).rejects.toThrow('exactly one transaction')

    expect(mockPaymentIntentsRetrieve).not.toHaveBeenCalled()
    expect(harness.finalizeOrder).not.toHaveBeenCalled()
  })

  it('should reject a transaction that does not belong to the canonical cart', async () => {
    const harness = createHarness({
      transaction: createTransaction({ cart: 'cart-other' }),
    })

    await expect(runConfirmation({ harness })).rejects.toThrow('cart')

    expect(harness.finalizeOrder).not.toHaveBeenCalled()
  })

  it('should reject provider amount drift before finalization', async () => {
    const harness = createHarness()
    mockPaymentIntentsRetrieve.mockResolvedValue(createPaymentIntent({ amount: 999 }))

    await expect(runConfirmation({ harness })).rejects.toThrow('amount')

    expect(harness.finalizeOrder).not.toHaveBeenCalled()
  })

  it('should reject provider item drift before finalization', async () => {
    const harness = createHarness()
    mockPaymentIntentsRetrieve.mockResolvedValue(
      createPaymentIntent({
        metadata: {
          ...createPaymentIntent().metadata,
          cartItemsSnapshot: JSON.stringify([
            { id: 'item-1', product: 'product-123', quantity: 2 },
          ]),
        },
      }),
    )

    await expect(runConfirmation({ harness })).rejects.toThrow('items')

    expect(harness.finalizeOrder).not.toHaveBeenCalled()
  })

  it('should log and propagate finalization failures', async () => {
    const harness = createHarness()
    const error = new Error('inventory update failed')
    harness.finalizeOrder.mockRejectedValue(error)

    await expect(runConfirmation({ harness })).rejects.toThrow(error.message)

    expect(harness.loggerError).toHaveBeenCalledWith({
      err: error,
      msg: 'Error confirming order with Stripe',
    })
  })
})
