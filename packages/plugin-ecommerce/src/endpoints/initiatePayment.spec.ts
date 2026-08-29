import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('payload', () => ({
  addDataAndFileToRequest: vi.fn(async () => undefined),
}))

import { initiatePaymentHandler } from './initiatePayment.js'

const currenciesConfig = {
  defaultCurrency: 'USD',
  supportedCurrencies: [{ code: 'USD', decimals: 2, label: 'USD', symbol: '$' }],
}

type Doc = Record<string, unknown>

const buildReq = ({
  cartItems,
  documents,
}: {
  cartItems: Doc[]
  documents: Record<string, Doc>
}) => {
  const findByID = vi.fn(async ({ collection, id }: { collection: string; id: number }) => {
    if (collection === 'carts') {
      return {
        id,
        currency: 'USD',
        customerEmail: 'customer@example.com',
        items: cartItems,
        subtotal: 1000,
      }
    }

    return documents[`${collection}:${id}`]
  })

  return {
    data: { cartID: 1, customerEmail: 'customer@example.com' },
    findByID,
    payload: { findByID, logger: { error: vi.fn() } },
    query: {},
    user: null,
  }
}

const paymentMethod = {
  initiatePayment: vi.fn(async () => ({ ok: true })),
}

const handler = initiatePaymentHandler({
  currenciesConfig,
  paymentMethod,
} as never)

describe('initiatePaymentHandler', () => {
  beforeEach(() => {
    paymentMethod.initiatePayment.mockClear()
  })

  it('rejects a variant item whose quantity exceeds the variant inventory', async () => {
    const req = buildReq({
      cartItems: [{ product: 2, quantity: 5, variant: 7 }],
      documents: {
        'variants:7': { id: 7, inventory: 2, priceInUSD: 1000 },
      },
    })

    const response = await handler(req as never)

    expect(response.status).toBe(400)
    expect(paymentMethod.initiatePayment).not.toHaveBeenCalled()
  })

  it('accepts a variant item whose quantity fits the variant inventory', async () => {
    const req = buildReq({
      cartItems: [{ product: 2, quantity: 2, variant: 7 }],
      documents: {
        'variants:7': { id: 7, inventory: 2, priceInUSD: 1000 },
      },
    })

    const response = await handler(req as never)

    expect(response.status).toBe(200)
    expect(paymentMethod.initiatePayment).toHaveBeenCalledTimes(1)
  })

  it('returns 404 for a variant item whose variant does not exist', async () => {
    const req = buildReq({
      cartItems: [{ product: 2, quantity: 1, variant: 7 }],
      documents: {},
    })

    const response = await handler(req as never)

    expect(response.status).toBe(404)
    expect(paymentMethod.initiatePayment).not.toHaveBeenCalled()
  })

  it('still rejects a product-only item whose quantity exceeds the product inventory', async () => {
    const req = buildReq({
      cartItems: [{ product: 2, quantity: 5 }],
      documents: {
        'products:2': { id: 2, inventory: 2, priceInUSD: 1000 },
      },
    })

    const response = await handler(req as never)

    expect(response.status).toBe(400)
    expect(paymentMethod.initiatePayment).not.toHaveBeenCalled()
  })
})
