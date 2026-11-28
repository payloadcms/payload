import { describe, expect, it, vi } from 'vitest'

import { initiatePayment } from './initiatePayment.js'
import { bindingRepresentative, xnoToRaw } from './nano.js'

type InitiatePaymentArgs = Parameters<ReturnType<typeof initiatePayment>>[0]

const ACCOUNT = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3'

const createHarness = () => {
  const create = vi.fn().mockResolvedValue({ id: 'txn-123' })
  const req = {
    payload: { create, logger: { error: vi.fn() } },
    user: { id: 'user-123' },
  } as unknown as InitiatePaymentArgs['req']

  return { create, req }
}

const run = (harness: ReturnType<typeof createHarness>, data: Record<string, unknown> = {}) =>
  initiatePayment({ account: ACCOUNT, prices: { USD: '0.0001' } })({
    data: {
      billingAddress: { city: 'Billing City' },
      cart: {
        id: 'cart-123',
        items: [{ product: { id: 'product-123' }, quantity: 2 }],
        subtotal: 1999,
      },
      currency: 'usd',
      customerEmail: 'buyer@example.com',
      shippingAddress: { city: 'Test City' },
      ...data,
    },
    req: harness.req,
    transactionsSlug: 'transactions',
  } as unknown as InitiatePaymentArgs)

describe('Nano initiatePayment', () => {
  it('should quote the exact raw amount and bind it to a fresh order reference', async () => {
    const harness = createHarness()

    const result = (await run(harness)) as Record<string, string>
    const priceRaw = 1999n * xnoToRaw('0.0001')

    expect(result.amountRaw).toBe(priceRaw.toString())
    expect(result.amountXNO).toBe('0.1999')
    expect(result.payTo).toBe(ACCOUNT)
    expect(result.transactionID).toBe('txn-123')
    expect(result.representative).toBe(
      bindingRepresentative({ payTo: ACCOUNT, priceRaw, reference: result.reference! }),
    )

    const created = harness.create.mock.calls[0][0].data

    expect(created.paymentMethod).toBe('nano')
    expect(created.status).toBe('pending')
    expect(created.currency).toBe('USD')
    expect(created.amount).toBe(1999)
    expect(created.nano.reference).toBe(result.reference)
    expect(created.nano.amountRaw).toBe(priceRaw.toString())
    expect(created.nano.shippingAddress).toEqual({ city: 'Test City' })
    expect(created.nano.blockHash).toBe(undefined)
  })

  it('should give two checkouts of the same cart different references', async () => {
    const first = (await run(createHarness())) as Record<string, string>
    const second = (await run(createHarness())) as Record<string, string>

    expect(first.reference).not.toBe(second.reference)
    expect(first.representative).not.toBe(second.representative)
  })

  it('should refuse a currency without a configured Nano price', async () => {
    const harness = createHarness()

    await expect(run(harness, { currency: 'EUR' })).rejects.toThrow('not configured for EUR')
    expect(harness.create).not.toHaveBeenCalled()
  })

  it('should refuse an empty cart', async () => {
    const harness = createHarness()

    const emptyCart = { id: 'cart-123', items: [], subtotal: 0 }

    await expect(run(harness, { cart: emptyCart })).rejects.toThrow('Cart is empty')
    expect(harness.create).not.toHaveBeenCalled()
  })
})
