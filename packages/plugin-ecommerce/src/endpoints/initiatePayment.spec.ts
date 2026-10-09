import { describe, expect, it, vi } from 'vitest'
import type { CurrenciesConfig, PaymentAdapter } from '../types/index.js'

import { USD } from '../currencies/index.js'
import { initiatePaymentHandler } from './initiatePayment'

const currenciesConfig: CurrenciesConfig = {
  defaultCurrency: 'USD',
  supportedCurrencies: [USD],
}

const cart = {
  id: 'cart-1',
  currency: 'USD',
  items: [{ product: 'product-1', quantity: 1 }],
  subtotal: 1000,
}

const product = {
  id: 'product-1',
  priceInUSD: 1000,
}

const createMockPayload = () => ({
  findByID: vi.fn(async ({ collection }: { collection: string }) => {
    if (collection === 'carts') {
      return cart
    }
    if (collection === 'products') {
      return product
    }
    return null
  }),
  logger: { error: vi.fn() },
})

const createMockReq = ({
  payload,
  user,
}: {
  payload: ReturnType<typeof createMockPayload>
  user: null | Record<string, unknown>
}) =>
  ({
    data: { cartID: 'cart-1' },
    payload,
    user,
  }) as any

describe('initiatePaymentHandler - customer vs non-customer users', () => {
  const createHandler = (initiatePayment: PaymentAdapter['initiatePayment']) =>
    initiatePaymentHandler({
      currenciesConfig,
      customersSlug: 'users',
      paymentMethod: { initiatePayment } as PaymentAdapter,
    })

  it('should resolve customerEmail from the user when req.user belongs to the customers collection', async () => {
    const initiatePayment = vi.fn().mockResolvedValue({ message: 'ok' })
    const payload = createMockPayload()
    const req = createMockReq({
      payload,
      user: { id: 'user-1', collection: 'users', email: 'customer@example.com' },
    })

    const response = await createHandler(initiatePayment)(req)

    expect(response.status).toBe(200)
    expect(initiatePayment).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ customerEmail: 'customer@example.com' }),
      }),
    )
  })

  it('should use data.customerEmail when req.user is from a non-customer collection', async () => {
    const initiatePayment = vi.fn().mockResolvedValue({ message: 'ok' })
    const payload = createMockPayload()
    const req = createMockReq({
      payload,
      user: { id: 'api-key-1', collection: 'api-keys' },
    })
    req.data.customerEmail = 'guest@example.com'

    const response = await createHandler(initiatePayment)(req)

    expect(response.status).toBe(200)
    expect(initiatePayment).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ customerEmail: 'guest@example.com' }),
      }),
    )
  })

  it('should reject with 400 when req.user is non-customer and no data.customerEmail is provided', async () => {
    const initiatePayment = vi.fn()
    const payload = createMockPayload()
    const req = createMockReq({
      payload,
      user: { id: 'api-key-1', collection: 'api-keys' },
    })

    const response = await createHandler(initiatePayment)(req)

    expect(response.status).toBe(400)
    expect(initiatePayment).not.toHaveBeenCalled()
  })
})
