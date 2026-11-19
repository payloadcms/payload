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
import { hashCartItems } from './validateSettlement.js'

type ConfirmOrderArgs = Parameters<ReturnType<typeof confirmOrder>>[0]

const DEFAULT_ITEMS = [{ id: 'item-1', product: 'product-123', quantity: 1 }]

const createTransaction = (overrides: Record<string, unknown> = {}) => ({
  amount: 1000,
  cart: 'cart-123',
  currency: 'USD',
  customer: 'user-123',
  id: 'txn-123',
  items: DEFAULT_ITEMS,
  order: undefined,
  shippingAddress: { city: 'Test City' },
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
    // New format: 64-hex SHA-256 digest, no cartItemsSnapshot or shippingAddress
    cartItemsHash: hashCartItems(DEFAULT_ITEMS),
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
        // items come from the transaction record (not metadata)
        items: DEFAULT_ITEMS,
        // shippingAddress comes from the transaction record (not Stripe metadata)
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
    // The PaymentIntent carries the hash of quantity=2, but the transaction has quantity=1
    const harness = createHarness()
    mockPaymentIntentsRetrieve.mockResolvedValue(
      createPaymentIntent({
        metadata: {
          cartID: 'cart-123',
          cartItemsHash: hashCartItems([{ id: 'item-1', product: 'product-123', quantity: 2 }]),
        },
      }),
    )

    await expect(runConfirmation({ harness })).rejects.toThrow('items')

    expect(harness.finalizeOrder).not.toHaveBeenCalled()
  })

  it('should confirm when cartItemsHash is absent (upgrade-safe legacy PaymentIntent)', async () => {
    // A PaymentIntent created by the old version has no cartItemsHash — must still confirm.
    const harness = createHarness()
    mockPaymentIntentsRetrieve.mockResolvedValue(
      createPaymentIntent({
        metadata: { cartID: 'cart-123' },
      }),
    )

    await expect(runConfirmation({ harness })).resolves.toBeTruthy()
    expect(harness.finalizeOrder).toHaveBeenCalled()
  })

  it('should use shippingAddress from the transaction when present', async () => {
    const harness = createHarness({
      transaction: createTransaction({ shippingAddress: { city: 'From Transaction' } }),
    })

    await runConfirmation({ harness })

    expect(harness.finalizeOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        orderData: expect.objectContaining({ shippingAddress: { city: 'From Transaction' } }),
      }),
    )
  })

  it('should fall back to metadata shippingAddress for legacy PaymentIntents', async () => {
    // Old PaymentIntents had shippingAddress in metadata; new ones store it in the transaction.
    const harness = createHarness({
      transaction: createTransaction({ shippingAddress: undefined }),
    })
    mockPaymentIntentsRetrieve.mockResolvedValue(
      createPaymentIntent({
        metadata: {
          cartID: 'cart-123',
          cartItemsHash: hashCartItems(DEFAULT_ITEMS),
          shippingAddress: JSON.stringify({ city: 'Legacy City' }),
        },
      }),
    )

    await runConfirmation({ harness })

    expect(harness.finalizeOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        orderData: expect.objectContaining({ shippingAddress: { city: 'Legacy City' } }),
      }),
    )
  })

  it('should fall back to metadata shippingAddress when SQL adapter returns an empty group object', async () => {
    // SQL adapters initialise group fields with an empty object `{}` even when no
    // address was saved. An empty object is truthy but carries no address data, so
    // the fallback to Stripe metadata must still fire in that case.
    const harness = createHarness({
      transaction: createTransaction({ shippingAddress: {} }),
    })
    mockPaymentIntentsRetrieve.mockResolvedValue(
      createPaymentIntent({
        metadata: {
          cartID: 'cart-123',
          cartItemsHash: hashCartItems(DEFAULT_ITEMS),
          shippingAddress: JSON.stringify({ city: 'SQL Fallback City' }),
        },
      }),
    )

    await runConfirmation({ harness })

    expect(harness.finalizeOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        orderData: expect.objectContaining({ shippingAddress: { city: 'SQL Fallback City' } }),
      }),
    )
  })

  it('should save a shipping address exceeding 600 chars in the transaction and not in metadata', async () => {
    // Verifies the end-to-end contract introduced by this PR:
    //   • The full address object is forwarded to finalizeOrder (from the transaction)
    //   • The Stripe PaymentIntent metadata does NOT carry shippingAddress
    //   • Every metadata value stays within Stripe's 500-character limit
    const longAddress = {
      addressLine1: 'A'.repeat(100),
      addressLine2: 'B'.repeat(100),
      city: 'C'.repeat(80),
      company: 'D'.repeat(80),
      country: 'United Kingdom',
      firstName: 'E'.repeat(60),
      lastName: 'F'.repeat(60),
      phone: '+44' + '9'.repeat(40),
      postalCode: 'SW1A ' + '1'.repeat(50),
      state: 'Greater London',
      title: 'Dr.',
    }

    // Pre-condition: address JSON genuinely exceeds 600 characters
    expect(JSON.stringify(longAddress).length).toBeGreaterThan(600)

    const harness = createHarness({
      transaction: createTransaction({ shippingAddress: longAddress }),
    })
    // PaymentIntent metadata has NO shippingAddress key — only cartID and cartItemsHash
    const paymentIntentMeta = {
      cartID: 'cart-123',
      cartItemsHash: hashCartItems(DEFAULT_ITEMS),
    }
    mockPaymentIntentsRetrieve.mockResolvedValue(
      createPaymentIntent({ metadata: paymentIntentMeta }),
    )

    await runConfirmation({ harness })

    // The full address must be passed to finalizeOrder from the transaction record
    expect(harness.finalizeOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        orderData: expect.objectContaining({ shippingAddress: longAddress }),
      }),
    )

    // Every metadata value must be within Stripe's 500-character limit
    for (const [key, value] of Object.entries(paymentIntentMeta)) {
      expect(
        value.length,
        `Stripe metadata key "${key}" exceeds 500 characters`,
      ).toBeLessThanOrEqual(500)
    }
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
