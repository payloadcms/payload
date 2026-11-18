import { describe, expect, it } from 'vitest'

import { bindingRepresentative, xnoToRaw } from './nano.js'
import { validateNanoSettlement, validateNanoSettlementIdentity } from './validateSettlement.js'

const ACCOUNT = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3'
const BLOCK_HASH = 'AB'.repeat(32)
const NOW = 1_800_000_000
const PRICE_RAW = 500n * xnoToRaw('0.001')
const REFERENCE = 'order-ref-1'

const representative = bindingRepresentative({
  payTo: ACCOUNT,
  priceRaw: PRICE_RAW,
  reference: REFERENCE,
})

const createArgs = (
  transactionOverrides: Record<string, unknown> = {},
  rest: Record<string, unknown> = {},
) => ({
  account: ACCOUNT,
  block: {
    amount: PRICE_RAW.toString(),
    confirmed: 'true',
    contents: { link_as_account: ACCOUNT, representative, type: 'state' },
    local_timestamp: String(NOW - 10),
    subtype: 'send',
  },
  blockHash: BLOCK_HASH,
  canonicalCartID: 'cart-123',
  customerEmail: 'Buyer@Example.com',
  maxAgeSeconds: 3600,
  now: NOW,
  reference: REFERENCE,
  transaction: {
    cart: 'cart-123',
    customerEmail: 'buyer@example.com',
    nano: { amountRaw: PRICE_RAW.toString(), payTo: ACCOUNT, reference: REFERENCE },
    paymentMethod: 'nano',
    status: 'pending',
    ...transactionOverrides,
  },
  user: null,
  ...rest,
})

describe('Nano settlement validation', () => {
  it('should accept a guest settlement with a case-insensitive email match', () => {
    expect(validateNanoSettlement(createArgs()).priceRaw).toBe(PRICE_RAW)
  })

  it('should reject a transaction paid by another method', () => {
    expect(() => validateNanoSettlement(createArgs({ paymentMethod: 'stripe' }))).toThrow(
      'reference does not match',
    )
  })

  it('should reject a canonical cart that differs from the transaction cart', () => {
    expect(() => validateNanoSettlement(createArgs({}, { canonicalCartID: 'cart-999' }))).toThrow(
      'Canonical cart',
    )
  })

  it('should reject an authenticated customer who does not own the transaction', () => {
    expect(() =>
      validateNanoSettlement(createArgs({ customer: 'user-1' }, { user: { id: 'user-2' } })),
    ).toThrow('Authenticated customer')
  })

  it('should reject a stored amount that is not a raw integer', () => {
    expect(() =>
      validateNanoSettlement(
        createArgs({ nano: { amountRaw: '0.5', payTo: ACCOUNT, reference: REFERENCE } }),
      ),
    ).toThrow('Raw amount')
  })

  it('should check only identity, not pending status or payment, for a settled retry', () => {
    const args = createArgs({ status: 'succeeded' })

    expect(() => validateNanoSettlement(args)).toThrow('not pending')
    expect(validateNanoSettlementIdentity(args).reference).toBe(REFERENCE)
    expect(() =>
      validateNanoSettlementIdentity(createArgs({ status: 'succeeded' }, { canonicalCartID: 'x' })),
    ).toThrow('Canonical cart')
  })
})
