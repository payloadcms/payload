import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const payloadUtilities = vi.hoisted(() => ({
  addDataAndFileToRequest: vi.fn(),
  commitTransaction: vi.fn(),
  initTransaction: vi.fn(),
  killTransaction: vi.fn(),
}))

vi.mock('payload', () => payloadUtilities)

import { confirmOrderHandler } from './confirmOrder.js'

type Handler = ReturnType<typeof confirmOrderHandler>
type Request = Parameters<Handler>[0]
type ConfirmArgs = Parameters<
  Parameters<typeof confirmOrderHandler>[0]['paymentMethod']['confirmOrder']
>[0]

type State = {
  cart: Record<string, unknown>
  inventoryUpdates: Array<{ collection: string; id: unknown; quantity: number }>
  order?: Record<string, unknown>
  reverseOrders?: Record<string, unknown>[]
  transaction: Record<string, unknown>
}

const createHarness = ({
  adapter,
  cart = {
    currency: 'USD',
    customerEmail: ' Buyer@Example.com ',
    id: 'cart-123',
    items: [],
    subtotal: 1000,
  },
  data = {
    cartID: 'submitted-cart',
    customerEmail: 'buyer@example.com',
    paymentIntentID: 'pi_123',
    secret: 'cart-secret',
  },
  initialTransactionID,
  transaction = {
    amount: 1000,
    currency: 'USD',
    id: 'txn-123',
    items: [{ product: 'product-123', quantity: 2 }],
    order: null,
    status: 'pending',
  },
  user = null as null | Record<string, unknown>,
}: {
  adapter?: (args: ConfirmArgs) => Promise<Record<string, unknown>>
  cart?: Record<string, unknown>
  data?: Record<string, unknown>
  initialTransactionID?: Request['transactionID']
  transaction?: Record<string, unknown>
  user?: null | Record<string, unknown>
} = {}) => {
  const state: State = {
    cart,
    inventoryUpdates: [],
    transaction,
  }

  const findByID = vi.fn(async ({ collection, id }: { collection: string; id: unknown }) => {
    if (collection === 'carts') {
      return state.cart
    }

    if (collection === 'transactions' && id === state.transaction.id) {
      return { ...state.transaction }
    }

    return null
  })
  const find = vi.fn(async ({ collection }: { collection: string }) => {
    if (collection !== 'orders') {
      return { docs: [], totalDocs: 0 }
    }

    const docs =
      state.reverseOrders ??
      (state.order &&
      Array.isArray(state.order.transactions) &&
      state.order.transactions.includes(state.transaction.id)
        ? [state.order]
        : [])

    return { docs, totalDocs: docs.length }
  })
  const create = vi.fn(
    async ({
      collection,
      data: orderData,
    }: {
      collection: string
      data: Record<string, unknown>
    }) => {
      if (collection !== 'orders') {
        throw new Error('Unexpected collection')
      }

      state.order = {
        accessToken: 'access-123',
        id: 'order-123',
        ...orderData,
      }

      return state.order
    },
  )
  const update = vi.fn(
    async ({
      collection,
      data: updateData,
      id,
    }: {
      collection: string
      data: Record<string, unknown>
      id: unknown
    }) => {
      if (collection === 'carts') {
        state.cart = { ...state.cart, ...updateData, id }

        return state.cart
      }

      state.transaction = { ...state.transaction, ...updateData, id }

      return state.transaction
    },
  )
  const updateOne = vi.fn(
    async ({
      collection,
      data: updateData,
      id,
      where,
    }: {
      collection: string
      data: Record<string, any>
      id?: unknown
      where?: Record<string, unknown>
    }) => {
      if (collection === 'transactions' && where) {
        if (state.transaction.status !== 'pending' || state.transaction.order) {
          return null
        }

        state.transaction = { ...state.transaction, ...updateData }

        return { ...state.transaction }
      }

      state.inventoryUpdates.push({
        collection,
        id,
        quantity: updateData.inventory.$inc,
      })

      return { id }
    },
  )
  const loggerError = vi.fn()
  const payload = {
    create,
    db: { updateOne },
    find,
    findByID,
    logger: { error: loggerError },
    update,
  }
  const confirmOrder = vi.fn(adapter ?? coreAdapter)
  const req = {
    data,
    payload,
    query: {},
    transactionID: initialTransactionID,
    user: user ?? undefined,
  } as unknown as Request
  const handler = confirmOrderHandler({
    currenciesConfig: {
      defaultCurrency: 'USD',
      supportedCurrencies: [],
    },
    paymentMethod: {
      confirmOrder,
    } as unknown as Parameters<typeof confirmOrderHandler>[0]['paymentMethod'],
  })

  return {
    confirmOrder,
    create,
    find,
    findByID,
    handler,
    loggerError,
    req,
    state,
    update,
    updateOne,
  }
}

const runHandler = async (harness: ReturnType<typeof createHarness>) => {
  const response = await harness.handler(harness.req)

  return {
    body: await response.json(),
    response,
  }
}

const coreAdapter = async ({ finalizeOrder }: ConfirmArgs) => {
  const order = await finalizeOrder({
    orderData: {
      amount: 1000,
      currency: 'USD',
      customerEmail: 'buyer@example.com',
      items: [{ product: 'product-123', quantity: 2 }],
      status: 'processing',
    },
    transactionID: 'txn-123',
  })

  return {
    accessToken: order.accessToken,
    message: 'Order confirmed successfully',
    orderID: order.id,
    transactionID: 'txn-123',
  }
}

describe('confirmOrderHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    payloadUtilities.addDataAndFileToRequest.mockResolvedValue(undefined)
    payloadUtilities.commitTransaction.mockResolvedValue(undefined)
    payloadUtilities.initTransaction.mockImplementation(async (req: Request) => {
      req.transactionID = 'request-transaction'

      return true
    })
    payloadUtilities.killTransaction.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should pass the canonical cart and normalized guest email to the adapter', async () => {
    const harness = createHarness()

    const { response } = await runHandler(harness)

    expect(response.status).toBe(200)
    expect(harness.confirmOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cartID: 'cart-123',
          customerEmail: 'buyer@example.com',
          paymentIntentID: 'pi_123',
        }),
        finalizeOrder: expect.any(Function),
      }),
    )
  })

  it('should reject a guest email that does not match the accessed cart', async () => {
    const harness = createHarness({
      data: {
        cartID: 'submitted-cart',
        customerEmail: 'attacker@example.com',
        paymentIntentID: 'pi_123',
      },
    })

    const { response } = await runHandler(harness)

    expect(response.status).toBe(500)
    expect(harness.confirmOrder).not.toHaveBeenCalled()
    expect(payloadUtilities.initTransaction).not.toHaveBeenCalled()
  })

  it('should reject a custom adapter that does not finalize the order', async () => {
    const harness = createHarness({
      adapter: async () => ({
        message: 'Order confirmed successfully',
        orderID: 'order-from-custom-adapter',
        transactionID: 'txn-123',
      }),
    })

    const { response } = await runHandler(harness)

    expect(response.status).toBe(500)
    expect(harness.state.inventoryUpdates).toHaveLength(0)
    expect(payloadUtilities.killTransaction).toHaveBeenCalledWith(harness.req)
    expect(payloadUtilities.commitTransaction).not.toHaveBeenCalled()
  })

  it('should reject a custom adapter response without a transaction ID', async () => {
    const harness = createHarness({
      adapter: async () => ({
        message: 'Order confirmed successfully',
        orderID: 'order-123',
      }),
    })

    const { response } = await runHandler(harness)

    expect(response.status).toBe(500)
    expect(harness.state.inventoryUpdates).toHaveLength(0)
    expect(payloadUtilities.killTransaction).toHaveBeenCalledWith(harness.req)
  })

  it('should atomically claim and finalize the order in core', async () => {
    const harness = createHarness({ adapter: coreAdapter })

    const { body, response } = await runHandler(harness)

    expect(response.status).toBe(200)
    expect(body).toEqual({
      accessToken: 'access-123',
      message: 'Order confirmed successfully',
      orderID: 'order-123',
      transactionID: 'txn-123',
    })
    expect(harness.updateOne).toHaveBeenNthCalledWith(1, {
      collection: 'transactions',
      data: { status: 'processing' },
      options: { atomic: true },
      req: harness.req,
      where: {
        and: [
          { id: { equals: 'txn-123' } },
          { status: { equals: 'pending' } },
          { order: { exists: false } },
        ],
      },
    })
    expect(harness.create).toHaveBeenCalledTimes(1)
    expect(harness.state.inventoryUpdates).toEqual([
      { collection: 'products', id: 'product-123', quantity: -2 },
    ])
    expect(harness.state.transaction).toMatchObject({
      order: 'order-123',
      status: 'succeeded',
    })
    expect(payloadUtilities.commitTransaction).toHaveBeenCalledWith(harness.req)
  })

  it('should reject an adapter response for a different transaction than it finalized', async () => {
    const harness = createHarness({
      adapter: async (args) => ({
        ...(await coreAdapter(args)),
        transactionID: 'txn-other',
      }),
    })

    const { response } = await runHandler(harness)

    expect(response.status).toBe(500)
    expect(payloadUtilities.killTransaction).toHaveBeenCalledWith(harness.req)
    expect(payloadUtilities.commitTransaction).not.toHaveBeenCalled()
  })

  it('should reject success when an adapter swallows a finalization failure', async () => {
    const harness = createHarness({
      adapter: async ({ finalizeOrder }) => {
        await finalizeOrder({
          orderData: {},
          transactionID: 'missing-transaction',
        }).catch(() => undefined)

        return {
          message: 'Order confirmed successfully',
          orderID: 'order-123',
          transactionID: 'missing-transaction',
        }
      },
    })
    harness.updateOne.mockResolvedValueOnce(null)
    harness.findByID.mockResolvedValueOnce(harness.state.cart).mockResolvedValueOnce(null)

    const { response } = await runHandler(harness)

    expect(response.status).toBe(500)
    expect(payloadUtilities.killTransaction).toHaveBeenCalledWith(harness.req)
    expect(payloadUtilities.commitTransaction).not.toHaveBeenCalled()
  })

  it('should return the exact linked order without repeating settlement side effects', async () => {
    const harness = createHarness({ adapter: coreAdapter })

    const first = await runHandler(harness)
    harness.req.transactionID = undefined
    const second = await runHandler(harness)

    expect(first.response.status).toBe(200)
    expect(second.response.status).toBe(200)
    expect(second.body).toEqual(first.body)
    expect(harness.create).toHaveBeenCalledTimes(1)
    expect(harness.state.inventoryUpdates).toHaveLength(1)
  })

  it('should recover the canonical order after an endpoint-owned transient claim conflict', async () => {
    const harness = createHarness({ adapter: coreAdapter })
    const conflict = Object.assign(new Error('Please retry your transaction.'), {
      code: 112,
      codeName: 'WriteConflict',
      errorLabels: ['TransientTransactionError'],
    })

    harness.updateOne.mockImplementationOnce(async () => {
      harness.state.transaction = {
        ...harness.state.transaction,
        order: 'order-123',
        status: 'succeeded',
      }
      harness.state.order = {
        accessToken: 'access-123',
        id: 'order-123',
        transactions: ['txn-123'],
      }

      throw conflict
    })
    payloadUtilities.killTransaction.mockImplementationOnce(async (req: Request) => {
      delete req.transactionID
    })

    const { body, response } = await runHandler(harness)

    expect(response.status).toBe(200)
    expect(body).toEqual({
      accessToken: 'access-123',
      message: 'Order confirmed successfully',
      orderID: 'order-123',
      transactionID: 'txn-123',
    })
    expect(payloadUtilities.killTransaction).toHaveBeenCalledWith(harness.req)
    expect(payloadUtilities.commitTransaction).not.toHaveBeenCalled()
    expect(harness.create).not.toHaveBeenCalled()
    expect(harness.state.inventoryUpdates).toHaveLength(0)
  })

  it('should fail closed when a succeeded transaction has ambiguous order links', async () => {
    const harness = createHarness({
      adapter: coreAdapter,
      transaction: {
        amount: 1000,
        currency: 'USD',
        id: 'txn-123',
        items: [{ product: 'product-123', quantity: 2 }],
        order: 'order-123',
        status: 'succeeded',
      },
    })
    harness.state.reverseOrders = [
      { id: 'order-123', transactions: ['txn-123'] },
      { id: 'order-other', transactions: ['txn-123'] },
    ]

    const { response } = await runHandler(harness)

    expect(response.status).toBe(500)
    expect(harness.create).not.toHaveBeenCalled()
    expect(harness.state.inventoryUpdates).toHaveLength(0)
  })

  it('should fail closed when an order already references the claimed pending transaction', async () => {
    const harness = createHarness({ adapter: coreAdapter })
    harness.state.reverseOrders = [{ id: 'historical-order', transactions: ['txn-123'] }]

    const { response } = await runHandler(harness)

    expect(response.status).toBe(500)
    expect(harness.create).not.toHaveBeenCalled()
    expect(harness.state.inventoryUpdates).toHaveLength(0)
  })

  it('should fail closed after bounded polling of a stale processing transaction', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-27T12:00:00.000Z'))
    const harness = createHarness({
      adapter: coreAdapter,
      transaction: {
        amount: 1000,
        currency: 'USD',
        id: 'txn-123',
        items: [{ product: 'product-123', quantity: 2 }],
        order: null,
        status: 'processing',
      },
    })

    const result = runHandler(harness)
    await vi.advanceTimersByTimeAsync(1000)
    const { response } = await result

    expect(response.status).toBe(500)
    expect(harness.create).not.toHaveBeenCalled()
    expect(harness.state.inventoryUpdates).toHaveLength(0)
  })

  it('should roll back an endpoint-owned transaction when finalization fails', async () => {
    const harness = createHarness({ adapter: coreAdapter })
    harness.updateOne
      .mockImplementationOnce(async () => ({
        ...harness.state.transaction,
        status: 'processing',
      }))
      .mockResolvedValueOnce(null)

    const { response } = await runHandler(harness)

    expect(response.status).toBe(500)
    expect(payloadUtilities.killTransaction).toHaveBeenCalledWith(harness.req)
    expect(payloadUtilities.commitTransaction).not.toHaveBeenCalled()
  })

  it('should preserve an inherited request transaction lifecycle', async () => {
    payloadUtilities.initTransaction.mockResolvedValue(false)
    const harness = createHarness({
      initialTransactionID: 'inherited-transaction',
    })

    const { response } = await runHandler(harness)

    expect(response.status).toBe(200)
    expect(payloadUtilities.commitTransaction).not.toHaveBeenCalled()
    expect(payloadUtilities.killTransaction).not.toHaveBeenCalled()
  })

  it('should pass the shared request to every direct database update', async () => {
    const harness = createHarness({ adapter: coreAdapter })

    await runHandler(harness)

    for (const [args] of harness.updateOne.mock.calls) {
      expect(args.req).toBe(harness.req)
    }
  })
})
