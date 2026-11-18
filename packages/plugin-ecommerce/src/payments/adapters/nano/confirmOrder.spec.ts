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
  claimResult = 'match' as 'match' | 'none',
  dbName = 'postgres',
  storedAfterClaim,
  transaction = createTransaction() as Record<string, unknown>,
  user = { id: 'user-123' } as null | Record<string, unknown>,
}: {
  block?: Record<string, unknown>
  claimedBy?: Record<string, unknown>[]
  claimResult?: 'match' | 'none'
  dbName?: string
  storedAfterClaim?: string
  transaction?: Record<string, unknown>
  user?: null | Record<string, unknown>
} = {}) => {
  const find = vi.fn(({ where }: { where: Record<string, unknown> }) =>
    Promise.resolve(
      'nano.reference' in where
        ? { docs: [transaction], totalDocs: 1 }
        : { docs: claimedBy, totalDocs: claimedBy.length },
    ),
  )
  const update = vi.fn().mockResolvedValue({})
  let stored = transaction
  const updateOne = vi.fn(
    ({ data }: { data: Record<string, unknown>; where: { and: unknown[] } }) => {
      if (claimResult === 'none') {
        return Promise.resolve(null)
      }
      const nano = data.nano as Record<string, unknown>
      const before = dbName === 'mongoose' ? {} : (transaction.nano as Record<string, unknown>)
      stored = {
        ...transaction,
        nano: { ...before, ...nano, blockHash: storedAfterClaim ?? nano.blockHash },
      }
      return Promise.resolve(stored)
    },
  )
  const findByID = vi.fn(() => Promise.resolve(stored))
  const loggerError = vi.fn()
  const finalizeOrder = vi.fn().mockResolvedValue({ accessToken: 'access-123', id: 'order-123' })
  const fetchImpl = vi.fn().mockResolvedValue({
    json: () => Promise.resolve(block),
    ok: true,
    status: 200,
  })
  const req = {
    payload: {
      db: { name: dbName, updateOne },
      find,
      findByID,
      logger: { error: loggerError },
      update,
    },
    user,
  } as unknown as ConfirmOrderArgs['req']

  return { fetchImpl, finalizeOrder, find, findByID, req, update, updateOne }
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
    expect(harness.updateOne).toHaveBeenCalledTimes(1)
    expect(harness.updateOne.mock.calls[0][0].data.nano.blockHash).toBe(BLOCK_HASH)
    expect(harness.updateOne.mock.calls[0][0].where).toEqual({
      and: [
        { id: { equals: 'txn-123' } },
        { status: { equals: 'pending' } },
        { 'nano.blockHash': { exists: false } },
      ],
    })
    expect(harness.update).not.toHaveBeenCalled()
    expect(harness.finalizeOrder).toHaveBeenCalledTimes(1)
    expect(harness.finalizeOrder.mock.calls[0][0].orderData.shippingAddress).toEqual({
      city: 'Test City',
    })
  })

  it('should write only the block hash in the atomic claim on SQL adapters', async () => {
    const transaction = createTransaction()
    const harness = createHarness({
      transaction: {
        ...transaction,
        nano: { ...transaction.nano, items: [{ sku: 'extra-1' }] },
      },
    })

    const result = await run({ harness })

    expect(result.orderID).toBe('order-123')
    expect(harness.updateOne.mock.calls[0][0].data).toEqual({ nano: { blockHash: BLOCK_HASH } })
  })

  it('should keep the stored group in the atomic claim on the MongoDB adapter', async () => {
    const transaction = createTransaction()
    const harness = createHarness({ dbName: 'mongoose', transaction })

    const result = await run({ harness })

    expect(result.orderID).toBe('order-123')
    expect(harness.updateOne.mock.calls[0][0].data).toEqual({
      nano: { ...transaction.nano, blockHash: BLOCK_HASH },
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
    expect(harness.updateOne).not.toHaveBeenCalled()
    expect(harness.finalizeOrder).not.toHaveBeenCalled()
  })

  it('should not overwrite a block hash claimed concurrently by another confirmation', async () => {
    // The pre-check saw an empty hash, but a concurrent request claimed first, so the
    // conditional write matches no document.
    const harness = createHarness({ claimResult: 'none' })

    await expect(run({ harness })).rejects.toThrow('another Nano block')
    expect(harness.updateOne).toHaveBeenCalledTimes(1)
    expect(harness.finalizeOrder).not.toHaveBeenCalled()
  })

  it('should refuse to finalize when the re-read claim is not this block', async () => {
    const harness = createHarness({ storedAfterClaim: 'CD'.repeat(32) })

    await expect(run({ harness })).rejects.toThrow('another Nano block')
    expect(harness.findByID).toHaveBeenCalledTimes(1)
    expect(harness.finalizeOrder).not.toHaveBeenCalled()
  })

  it('should re-claim with a guarded write when a pending transaction already holds this block', async () => {
    const transaction = createTransaction()
    const harness = createHarness({
      transaction: { ...transaction, nano: { ...transaction.nano, blockHash: BLOCK_HASH } },
    })

    const result = await run({ harness })

    expect(result.orderID).toBe('order-123')
    expect(harness.updateOne.mock.calls[0][0].where.and[2]).toEqual({
      'nano.blockHash': { equals: BLOCK_HASH },
    })
  })

  it('should return the existing order when retrying an already-settled confirmation', async () => {
    const transaction = createTransaction()
    const harness = createHarness({
      // Block is now older than maxAgeSeconds; a retry must still recover the order.
      block: createBlock({ local_timestamp: String(NOW - 10 * 86400) }),
      transaction: {
        ...transaction,
        nano: { ...transaction.nano, blockHash: BLOCK_HASH.toLowerCase() },
        order: 'order-123',
        status: 'succeeded',
      },
    })

    const result = await run({ harness })

    expect(result.orderID).toBe('order-123')
    expect(result.transactionID).toBe('txn-123')
    expect(harness.fetchImpl).not.toHaveBeenCalled()
    expect(harness.updateOne).not.toHaveBeenCalled()
    expect(harness.update).not.toHaveBeenCalled()
    expect(harness.finalizeOrder).toHaveBeenCalledTimes(1)
    expect(harness.finalizeOrder.mock.calls[0][0].transactionID).toBe('txn-123')
  })

  it('should still check identity when retrying an already-settled confirmation', async () => {
    const transaction = createTransaction()
    const harness = createHarness({
      transaction: {
        ...transaction,
        nano: { ...transaction.nano, blockHash: BLOCK_HASH },
        order: 'order-123',
        status: 'succeeded',
      },
      user: { id: 'user-999' },
    })

    await expect(run({ harness })).rejects.toThrow('Authenticated customer')
    expect(harness.finalizeOrder).not.toHaveBeenCalled()
  })

  it('should refuse a settled transaction presented with a different block', async () => {
    const transaction = createTransaction()
    const harness = createHarness({
      transaction: {
        ...transaction,
        nano: { ...transaction.nano, blockHash: 'CD'.repeat(32) },
        order: 'order-123',
        status: 'succeeded',
      },
    })

    await expect(run({ harness })).rejects.toThrow('not pending')
    expect(harness.updateOne).not.toHaveBeenCalled()
    expect(harness.finalizeOrder).not.toHaveBeenCalled()
  })

  it('should refuse a send of the wrong amount', async () => {
    const harness = createHarness({ block: createBlock({ amount: (PRICE_RAW - 1n).toString() }) })

    await expect(run({ harness })).rejects.toThrow('amount')
    expect(harness.updateOne).not.toHaveBeenCalled()
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

  it('should refuse a non-pending transaction that this block has not claimed', async () => {
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
