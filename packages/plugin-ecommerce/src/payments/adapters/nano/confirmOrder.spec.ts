import { describe, expect, it, vi } from 'vitest'

import { confirmOrder } from './confirmOrder.js'
import { bindingRepresentative, xnoToRaw } from './nano.js'

type ConfirmOrderArgs = Parameters<ReturnType<typeof confirmOrder>>[0]

const ACCOUNT = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3'
const BLOCK_HASH = 'AB'.repeat(32)
const NOW = 1_800_000_000
const PRICE_RAW = 1000n * xnoToRaw('0.0001')
const REFERENCE = 'c2a7c0de-0000-4000-8000-000000000001'
const REPRESENTATIVE = bindingRepresentative({
  payTo: ACCOUNT,
  priceRaw: PRICE_RAW,
  reference: REFERENCE,
})

const createTransaction = (overrides: Record<string, unknown> = {}) => ({
  amount: 1000,
  cart: 'cart-123',
  currency: 'USD',
  customer: 'user-123',
  id: 'txn-123',
  items: [{ id: 'item-1', product: 'product-123', quantity: 1 }],
  nano: {
    amountRaw: PRICE_RAW.toString(),
    payTo: ACCOUNT,
    reference: REFERENCE,
    representative: REPRESENTATIVE,
    shippingAddress: { city: 'Test City' },
  },
  paymentMethod: 'nano',
  status: 'pending',
  ...overrides,
})

const createBlock = (overrides: Record<string, unknown> = {}) => ({
  amount: PRICE_RAW.toString(),
  confirmed: 'true',
  contents: {
    link_as_account: ACCOUNT,
    representative: REPRESENTATIVE,
    type: 'state',
  },
  local_timestamp: String(NOW - 30),
  subtype: 'send',
  ...overrides,
})

const createHarness = ({
  block = createBlock() as Record<string, unknown>,
  claimedBy = [] as Record<string, unknown>[],
  transaction = createTransaction() as Record<string, unknown>,
  user = { id: 'user-123' } as null | Record<string, unknown>,
} = {}) => {
  const find = vi.fn(({ where }: { where: Record<string, unknown> }) =>
    Promise.resolve(
      'nano.reference' in where
        ? { docs: [transaction], totalDocs: 1 }
        : { docs: claimedBy, totalDocs: claimedBy.length },
    ),
  )
  const update = vi.fn().mockResolvedValue({})
  const loggerError = vi.fn()
  const finalizeOrder = vi.fn().mockResolvedValue({ accessToken: 'access-123', id: 'order-123' })
  const fetchImpl = vi.fn().mockResolvedValue({
    json: () => Promise.resolve(block),
    ok: true,
    status: 200,
  })
  const req = {
    payload: { find, logger: { error: loggerError }, update },
    user,
  } as unknown as ConfirmOrderArgs['req']

  return { fetchImpl, finalizeOrder, find, req, update }
}

const run = ({
  data = {},
  harness,
}: {
  data?: Record<string, unknown>
  harness: ReturnType<typeof createHarness>
}) =>
  confirmOrder({
    account: ACCOUNT,
    fetchImpl: harness.fetchImpl as unknown as typeof fetch,
    maxAgeSeconds: 86400,
    nodeURL: 'https://node.example/rpc',
    now: () => NOW,
  })({
    data: {
      blockHash: BLOCK_HASH,
      cartID: 'cart-123',
      customerEmail: 'buyer@example.com',
      reference: REFERENCE,
      ...data,
    },
    finalizeOrder: harness.finalizeOrder as unknown as ConfirmOrderArgs['finalizeOrder'],
    req: harness.req,
    transactionsSlug: 'transactions',
  })

describe('Nano confirmOrder', () => {
  it('should claim the block and finalize the order for a matching send', async () => {
    const harness = createHarness()

    const result = await run({ harness })

    expect(result.orderID).toBe('order-123')
    expect(result.transactionID).toBe('txn-123')
    expect(harness.fetchImpl).toHaveBeenCalledTimes(1)
    expect(harness.update).toHaveBeenCalledTimes(1)
    expect(harness.update.mock.calls[0][0].data.nano.blockHash).toBe(BLOCK_HASH)
    expect(harness.finalizeOrder).toHaveBeenCalledTimes(1)
    expect(harness.finalizeOrder.mock.calls[0][0].orderData.shippingAddress).toEqual({
      city: 'Test City',
    })
  })

  it('should refuse a block that already settled another transaction', async () => {
    const harness = createHarness({ claimedBy: [{ id: 'txn-other' }] })

    await expect(run({ harness })).rejects.toThrow('already settled another transaction')
    expect(harness.fetchImpl).not.toHaveBeenCalled()
    expect(harness.finalizeOrder).not.toHaveBeenCalled()
  })

  it('should refuse a second block for a transaction already claimed by a block', async () => {
    const transaction = createTransaction()
    const harness = createHarness({
      transaction: { ...transaction, nano: { ...transaction.nano, blockHash: 'CD'.repeat(32) } },
    })

    await expect(run({ harness })).rejects.toThrow('another Nano block')
    expect(harness.update).not.toHaveBeenCalled()
    expect(harness.finalizeOrder).not.toHaveBeenCalled()
  })

  it('should refuse a send of the wrong amount', async () => {
    const harness = createHarness({ block: createBlock({ amount: (PRICE_RAW - 1n).toString() }) })

    await expect(run({ harness })).rejects.toThrow('amount')
    expect(harness.update).not.toHaveBeenCalled()
    expect(harness.finalizeOrder).not.toHaveBeenCalled()
  })

  it('should refuse a transaction created for another receiving account', async () => {
    const transaction = createTransaction()
    const harness = createHarness({
      transaction: {
        ...transaction,
        nano: {
          ...transaction.nano,
          payTo: 'nano_1111111111111111111111111111111111111111111111111111hifc8npp',
        },
      },
    })

    await expect(run({ harness })).rejects.toThrow('configured account')
    expect(harness.finalizeOrder).not.toHaveBeenCalled()
  })

  it('should refuse a transaction that is no longer pending', async () => {
    const harness = createHarness({ transaction: createTransaction({ status: 'succeeded' }) })

    await expect(run({ harness })).rejects.toThrow('not pending')
    expect(harness.finalizeOrder).not.toHaveBeenCalled()
  })

  it('should refuse a guest whose email does not match the transaction', async () => {
    const harness = createHarness({
      transaction: createTransaction({ customer: undefined, customerEmail: 'other@example.com' }),
      user: null,
    })

    await expect(run({ harness })).rejects.toThrow('Guest email')
    expect(harness.finalizeOrder).not.toHaveBeenCalled()
  })

  it('should refuse a malformed block hash before any lookup', async () => {
    const harness = createHarness()

    await expect(run({ data: { blockHash: 'not-a-hash' }, harness })).rejects.toThrow('block hash')
    expect(harness.find).not.toHaveBeenCalled()
  })
})
