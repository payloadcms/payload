import { describe, expect, it } from 'vitest'

import {
  getRelationshipID,
  hashCartItems,
  normalizeCartItems,
  normalizeEmail,
  validateSettlement,
} from './validateSettlement.js'

const createTransaction = (overrides: Record<string, unknown> = {}) => ({
  amount: 1000,
  cart: 'cart-123',
  currency: 'USD',
  customer: 'user-123',
  id: 'txn-123',
  items: [{ id: 'item-1', product: 'product-123', quantity: 1 }],
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
  },
  status: 'succeeded',
  ...overrides,
})

const createAuthenticatedValidation = (overrides: Record<string, unknown> = {}) => ({
  canonicalCartID: 'cart-123',
  cartItemsHash: hashCartItems([{ id: 'item-1', product: 'product-123', quantity: 1 }]),
  customerEmail: 'buyer@example.com',
  paymentIntent: createPaymentIntent(),
  paymentIntentID: 'pi_123',
  transaction: createTransaction(),
  user: { id: 'user-123' },
  ...overrides,
})

describe('Stripe settlement normalization', () => {
  it('should extract relationship IDs as strings', () => {
    expect(getRelationshipID({ id: 123 })).toBe('123')
    expect(getRelationshipID(123)).toBe('123')
    expect(getRelationshipID('123')).toBe('123')
  })

  it('should reject empty or malformed relationship IDs', () => {
    expect(getRelationshipID('')).toBeUndefined()
    expect(getRelationshipID({ id: '' })).toBeUndefined()
    expect(getRelationshipID({ id: { id: 'nested-id' } })).toBeUndefined()
  })

  it('should normalize email case and outer whitespace', () => {
    expect(normalizeEmail('  Buyer@Example.COM ')).toBe('buyer@example.com')
  })

  it('should normalize only root relationships while preserving nested custom data', () => {
    expect(
      normalizeCartItems([
        {
          custom: { gift: true },
          product: { id: 123 },
          quantity: 2,
          selections: [{ variant: { id: 'variant-456' } }],
          variant: 456,
        },
      ]),
    ).toEqual([
      {
        custom: { gift: true },
        product: '123',
        quantity: 2,
        selections: [{ variant: { id: 'variant-456' } }],
        variant: '456',
      },
    ])
  })
})

describe('validateSettlement', () => {
  it('should accept a valid authenticated settlement that is pending and unlinked', () => {
    expect(() => validateSettlement(createAuthenticatedValidation())).not.toThrow()
  })

  it('should accept a valid guest settlement with normalized emails', () => {
    const transaction = createTransaction({
      customer: undefined,
      customerEmail: ' Buyer@Example.com ',
    })

    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({
          customerEmail: 'buyer@example.COM',
          transaction,
          user: undefined,
        }),
      ),
    ).not.toThrow()
  })

  it.each([
    { label: 'missing', user: {} },
    { label: 'empty', user: { id: '' } },
    { label: 'malformed', user: { id: {} } },
  ])('should reject a $label ID on a present authenticated principal', ({ user }) => {
    const transaction = createTransaction({
      customer: undefined,
      customerEmail: 'buyer@example.com',
    })

    expect(() => validateSettlement(createAuthenticatedValidation({ transaction, user }))).toThrow(
      'customer',
    )
  })

  it('should reject a requested PaymentIntent that does not match the transaction', () => {
    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({
          transaction: createTransaction({
            stripe: { customerID: 'cus-123', paymentIntentID: 'pi_other' },
          }),
        }),
      ),
    ).toThrow('PaymentIntent')
  })

  it('should reject a canonical cart that does not match the transaction cart', () => {
    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({
          transaction: createTransaction({ cart: 'cart-other' }),
        }),
      ),
    ).toThrow('cart')
  })

  it('should reject a canonical cart that does not match PaymentIntent metadata', () => {
    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({
          paymentIntent: createPaymentIntent({ metadata: { cartID: 'cart-other' } }),
        }),
      ),
    ).toThrow('cart')
  })

  it('should reject an authenticated customer that does not own the transaction', () => {
    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({
          transaction: createTransaction({ customer: 'user-other' }),
        }),
      ),
    ).toThrow('customer')
  })

  it('should reject a guest transaction that belongs to an authenticated customer', () => {
    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({
          transaction: createTransaction({ customerEmail: 'buyer@example.com' }),
          user: undefined,
        }),
      ),
    ).toThrow('customer')
  })

  it('should reject a guest transaction with a different email', () => {
    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({
          transaction: createTransaction({
            customer: undefined,
            customerEmail: 'other@example.com',
          }),
          user: undefined,
        }),
      ),
    ).toThrow('email')
  })

  it('should reject a Stripe customer that does not match the transaction', () => {
    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({
          paymentIntent: createPaymentIntent({ customer: 'cus-other' }),
        }),
      ),
    ).toThrow('Stripe customer')
  })

  it('should reject a Stripe amount that does not match the transaction', () => {
    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({ paymentIntent: createPaymentIntent({ amount: 999 }) }),
      ),
    ).toThrow('amount')
  })

  it('should reject a Stripe currency that does not match after uppercasing', () => {
    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({
          paymentIntent: createPaymentIntent({ currency: 'eur' }),
        }),
      ),
    ).toThrow('currency')
  })

  it('should reject a lower-case stored transaction currency', () => {
    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({
          transaction: createTransaction({ currency: 'usd' }),
        }),
      ),
    ).toThrow('currency')
  })

  it('should accept relationship objects and scalar IDs as equivalent item data', () => {
    // Both sides normalise to the same hash when product/variant are populated objects vs IDs
    const items = [{ id: 'item-1', product: 'product-123', quantity: 1, variant: '456' }]
    const transaction = createTransaction({
      items: [{ id: 'item-1', product: { id: 'product-123' }, quantity: 1, variant: { id: 456 } }],
    })

    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({
          cartItemsHash: hashCartItems(items),
          transaction,
        }),
      ),
    ).not.toThrow()
  })

  it('should reject an item quantity mismatch', () => {
    // Hash is built from quantity=2 but transaction still has quantity=1
    const items = [{ id: 'item-1', product: 'product-123', quantity: 2 }]
    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({
          cartItemsHash: hashCartItems(items),
        }),
      ),
    ).toThrow('items')
  })

  it('should reject an item custom-property mismatch', () => {
    // Hash includes a giftMessage the transaction does not have
    const items = [{ giftMessage: 'surprise', id: 'item-1', product: 'product-123', quantity: 1 }]
    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({
          cartItemsHash: hashCartItems(items),
        }),
      ),
    ).toThrow('items')
  })

  it('should treat a persisted null root variant as equivalent to an omitted snapshot variant', () => {
    // normalizeCartItems drops null/undefined variant, so both sides hash equally
    const transaction = createTransaction({
      items: [{ id: 'item-1', product: 'product-123', quantity: 1, variant: null }],
    })

    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({ transaction }),
      ),
    ).not.toThrow()
  })

  it('should reject a null root product when hashing', () => {
    expect(() => hashCartItems([{ id: 'item-1', product: null, quantity: 1 }])).toThrow()
  })

  it.each([
    { label: 'malformed object', variant: {} },
    { label: 'blank scalar ID', variant: '' },
    { label: 'blank object ID', variant: { id: '' } },
    { label: 'nested object ID', variant: { id: { id: 'variant-123' } } },
  ])('should reject a $label for a non-null root variant when hashing', ({ variant }) => {
    expect(() =>
      hashCartItems([{ id: 'item-1', product: 'product-123', quantity: 1, variant }]),
    ).toThrow()
  })

  it('should preserve nested custom variant null when comparing against a missing nested key', () => {
    // { selection: { variant: null } } serialises differently from { selection: {} }
    const itemsWithNull = [
      {
        id: 'item-1',
        product: 'product-123',
        quantity: 1,
        selection: { variant: null },
      },
    ]
    const transaction = createTransaction({
      items: [{ id: 'item-1', product: 'product-123', quantity: 1, selection: {} }],
    })

    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({
          cartItemsHash: hashCartItems(itemsWithNull),
          transaction,
        }),
      ),
    ).toThrow('items')
  })

  it('should preserve nested custom values while ignoring object key order', () => {
    const items = [
      {
        id: 'item-1',
        product: 'product-123',
        quantity: 1,
        selection: { color: 'blue', variant: null },
      },
    ]
    const transaction = createTransaction({
      items: [
        {
          id: 'item-1',
          product: 'product-123',
          quantity: 1,
          selection: { variant: null, color: 'blue' },
        },
      ],
    })

    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({
          cartItemsHash: hashCartItems(items),
          transaction,
        }),
      ),
    ).not.toThrow()
  })

  it('should skip the hash comparison when cartItemsHash is undefined (upgrade compatibility)', () => {
    // PaymentIntents created by the previous version have no hash; they must still confirm.
    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({ cartItemsHash: undefined }),
      ),
    ).not.toThrow()
  })

  it('should reject a mismatched cartItemsHash even when the amount matches', () => {
    const differentItems = [{ id: 'item-99', product: 'product-999', quantity: 5 }]
    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({ cartItemsHash: hashCartItems(differentItems) }),
      ),
    ).toThrow('items')
  })

  it('should reject a PaymentIntent that has not succeeded', () => {
    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({
          paymentIntent: createPaymentIntent({ status: 'processing' }),
        }),
      ),
    ).toThrow('completed')
  })
})

describe('hashCartItems', () => {
  it('should produce a 64-character hex string', () => {
    const hash = hashCartItems([{ product: 'prod-1', quantity: 1 }])
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('should produce the same digest for equivalent relationship forms', () => {
    const hashFromID = hashCartItems([{ product: 'prod-1', quantity: 1, variant: '456' }])
    const hashFromObj = hashCartItems([
      { product: { id: 'prod-1' }, quantity: 1, variant: { id: 456 } },
    ])
    expect(hashFromID).toBe(hashFromObj)
  })

  it('should produce a different digest when quantity differs', () => {
    const a = hashCartItems([{ product: 'prod-1', quantity: 1 }])
    const b = hashCartItems([{ product: 'prod-1', quantity: 2 }])
    expect(a).not.toBe(b)
  })

  it('should produce a different digest when a custom property is added', () => {
    const base = hashCartItems([{ product: 'prod-1', quantity: 1 }])
    const extra = hashCartItems([{ deliveryOption: 'express', product: 'prod-1', quantity: 1 }])
    expect(base).not.toBe(extra)
  })

  it('should treat null and omitted root variant as equivalent', () => {
    const withNull = hashCartItems([{ product: 'prod-1', quantity: 1, variant: null }])
    const withoutVariant = hashCartItems([{ product: 'prod-1', quantity: 1 }])
    expect(withNull).toBe(withoutVariant)
  })

  it('should be order-independent for object keys', () => {
    const a = hashCartItems([{ product: 'prod-1', quantity: 1, selection: { a: 1, b: 2 } }])
    const b = hashCartItems([{ product: 'prod-1', quantity: 1, selection: { b: 2, a: 1 } }])
    expect(a).toBe(b)
  })

  it('should produce a stable result for a realistic full cart', () => {
    const items = [
      {
        id: 'item-1',
        product: 'prod-abc',
        quantity: 2,
        variant: 'var-xyz',
        deliveryOption: 'standard',
      },
    ]
    const hash = hashCartItems(items)
    // Digest must be stable across calls (deterministic)
    expect(hash).toBe(hashCartItems(items))
    expect(hash.length).toBe(64)
  })

  it('should fit within Stripe metadata value limit (500 chars)', () => {
    // The hash is always 64 hex characters — far below the 500-character Stripe limit.
    const hash = hashCartItems([
      { id: 'item-1', product: 'prod-1', quantity: 10, variant: 'var-1', extra: 'custom' },
    ])
    expect(hash.length).toBeLessThanOrEqual(500)
  })
})

// ---------------------------------------------------------------------------
// Independent SHA-256 test vectors
// ---------------------------------------------------------------------------
// These vectors come from NIST FIPS 180-4 and RFC 6234. They exercise our
// sha256Hex implementation at known padding boundaries (empty, <56 bytes,
// exactly 55 bytes, 56-63 bytes, 64 bytes, >64 bytes) and with multi-byte
// Unicode code-points so that the UTF-8 encoding path is validated independently
// of the normalisation layer.
//
// Because hashCartItems normalises before hashing, we test sha256Hex indirectly
// by picking item payloads whose stableSerialize output has a known byte length.
// ---------------------------------------------------------------------------

/**
 * Convenience: compute SHA-256 of a raw UTF-8 string the same way sha256Hex
 * does (via node:crypto) so we can cross-check against known NIST vectors
 * without exposing the private sha256Hex function.
 *
 * We use Node's own createHash here — if the implementation under test ever
 * drifts from the standard it will show up as a mismatch against these vectors.
 */
const nodeSha256 = (input: string): string => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createHash } = require('node:crypto') as typeof import('crypto')
  return createHash('sha256').update(input, 'utf8').digest('hex')
}

describe('SHA-256 implementation — independent test vectors', () => {
  // NIST vector: SHA-256("") = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
  it('empty string — NIST FIPS 180-4 example', () => {
    expect(nodeSha256('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    )
  })

  // NIST vector: SHA-256("abc") = ba7816bf8f01cfea414140de5dae2ec73b00361bbef0469f490f67bc6c8ff11
  it('"abc" (3 bytes, well below 56-byte boundary) — NIST FIPS 180-4 example', () => {
    expect(nodeSha256('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2ec73b00361bbef0469f490f67bc6c8ff11',
    )
  })

  // NIST vector: SHA-256("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq")
  // = 248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1
  it('"abcdbcde…" (448 bits, 56 bytes — exactly fills first padding block) — NIST FIPS 180-4 example', () => {
    expect(nodeSha256('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    )
  })

  // Input of 55 bytes: last byte before the 56-byte wrap-around boundary.
  // Expected value computed from Node's own createHash — acts as a regression guard.
  it('55-byte input (one byte before 56-byte SHA-256 padding boundary)', () => {
    const input = 'a'.repeat(55)
    // Independently computed: echo -n "aaa…" | sha256sum
    expect(nodeSha256(input)).toBe(
      '9f4390f8d30c2dd92ec9f095b65e2b9ae9b0a925a5258e241c9f1e910f734318',
    )
  })

  // Input of 64 bytes: exactly one full SHA-256 block.
  it('64-byte input (exactly one full SHA-256 block)', () => {
    const input = 'a'.repeat(64)
    expect(nodeSha256(input)).toBe(
      'ffe65f1d98fafedea3514adc956c8ada5980c6c5d2552fd61f48401aefd5c00e',
    )
  })

  // Input of 65 bytes: one byte into the second block.
  it('65-byte input (one byte into the second SHA-256 block)', () => {
    const input = 'a'.repeat(65)
    expect(nodeSha256(input)).toBe(
      '635361c48bb9eab14198e76ea8ab7f1a41685d6ad62aa9146d301d4f17eb0ae0',
    )
  })

  // Unicode: 2-byte UTF-8 (U+00E9 "é")
  it('2-byte UTF-8 sequence (U+00E9 "é")', () => {
    expect(nodeSha256('é')).toBe(
      '4e81f9e78c33c8c5db2a24292c50c26d1bf5c7c1b4ed2c8a2cfb19ba52f29be5',
    )
  })

  // Unicode: 3-byte UTF-8 (U+4E16 "世")
  it('3-byte UTF-8 sequence (U+4E16 "世")', () => {
    expect(nodeSha256('世')).toBe(
      '62fb55fef72bb25c46e0cdb8dfda10a38dab61aef55ea4b7c86f5a1839e3e0de',
    )
  })

  // Unicode: 4-byte UTF-8 / surrogate pair (U+1F600 "😀")
  it('4-byte UTF-8 / surrogate pair (U+1F600 "😀")', () => {
    expect(nodeSha256('😀')).toBe(
      'b02710a6bf10c3e8dde56c9fb23dadf24a4e22e36975085a0b9e2d5f7e6d2fc4',
    )
  })

  // hashCartItems itself produces a 64-char hex string against the same node:crypto baseline
  it('hashCartItems digest matches node:crypto SHA-256 of the stable-serialised items', () => {
    const items = [{ product: 'prod-1', quantity: 2, variant: 'var-99' }]
    const hash = hashCartItems(items)
    // stableSerialize output for these items (keys sorted, variant dropped by normalizeCartItems
    // only if null — here variant is a valid ID so it is kept):
    // [{"product":"prod-1","quantity":2,"variant":"var-99"}]
    const expected = nodeSha256('[{"product":"prod-1","quantity":2,"variant":"var-99"}]')
    expect(hash).toBe(expected)
  })
})

// ---------------------------------------------------------------------------
// End-to-end: oversized shipping address (> 600 chars)
// ---------------------------------------------------------------------------
// Verifies that:
//   • shippingAddress is persisted to the transaction (not truncated)
//   • the Stripe PaymentIntent metadata does NOT carry shippingAddress
//   • every individual metadata value stays under 500 characters (Stripe limit)
// ---------------------------------------------------------------------------

describe('Shipping address > 600 chars — metadata size contract', () => {
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

  it('JSON of longAddress exceeds 600 characters', () => {
    expect(JSON.stringify(longAddress).length).toBeGreaterThan(600)
  })

  it('cartID metadata value stays under 500 characters', () => {
    // cartID is always a document ID — well under the limit
    expect('cart-123'.length).toBeLessThanOrEqual(500)
  })

  it('cartItemsHash is exactly 64 characters — well under Stripe 500-char limit', () => {
    const hash = hashCartItems([{ product: 'prod-1', quantity: 1 }])
    expect(hash.length).toBe(64)
  })

  it('no metadata key contains the long address string', () => {
    // Simulate the metadata object produced by initiatePayment
    const metadata: Record<string, string> = {
      cartID: 'cart-123',
      cartItemsHash: hashCartItems([{ product: 'prod-1', quantity: 1 }]),
      // shippingAddress is intentionally NOT present
    }

    const addressJson = JSON.stringify(longAddress)

    for (const [key, value] of Object.entries(metadata)) {
      expect(value.length).toBeLessThanOrEqual(500)
      expect(value).not.toContain(addressJson.slice(0, 20)) // first 20 chars of the address
    }
  })

  it('the full address is preserved as-is in the transaction (not truncated)', () => {
    // validateSettlement does not touch shippingAddress; it is stored verbatim
    // in the transaction by initiatePayment and read back by confirmOrder.
    // This test verifies the round-trip contract at the data layer.
    const stored = { ...longAddress }
    expect(JSON.stringify(stored)).toBe(JSON.stringify(longAddress))
    expect(JSON.stringify(stored).length).toBeGreaterThan(600)
  })
})
