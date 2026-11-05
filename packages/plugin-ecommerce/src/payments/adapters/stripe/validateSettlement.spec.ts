import { describe, expect, it } from 'vitest'

import {
  getRelationshipID,
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
  cartItemsSnapshot: [{ id: 'item-1', product: 'product-123', quantity: 1 }],
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
    const transaction = createTransaction({
      items: [{ id: 'item-1', product: { id: 123 }, quantity: 1, variant: { id: 456 } }],
    })

    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({
          cartItemsSnapshot: [{ id: 'item-1', product: '123', quantity: 1, variant: '456' }],
          transaction,
        }),
      ),
    ).not.toThrow()
  })

  it('should reject an item quantity mismatch', () => {
    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({
          cartItemsSnapshot: [{ id: 'item-1', product: 'product-123', quantity: 2 }],
        }),
      ),
    ).toThrow('items')
  })

  it('should reject an item custom-property mismatch', () => {
    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({
          cartItemsSnapshot: [
            { giftMessage: 'surprise', id: 'item-1', product: 'product-123', quantity: 1 },
          ],
        }),
      ),
    ).toThrow('items')
  })

  it('should treat a persisted null root variant as equivalent to an omitted snapshot variant', () => {
    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({
          transaction: createTransaction({
            items: [{ id: 'item-1', product: 'product-123', quantity: 1, variant: null }],
          }),
        }),
      ),
    ).not.toThrow()
  })

  it('should reject a null root product', () => {
    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({
          cartItemsSnapshot: [{ id: 'item-1', product: null, quantity: 1 }],
        }),
      ),
    ).toThrow()
  })

  it.each([
    { label: 'malformed object', variant: {} },
    { label: 'blank scalar ID', variant: '' },
    { label: 'blank object ID', variant: { id: '' } },
    { label: 'nested object ID', variant: { id: { id: 'variant-123' } } },
  ])('should reject a $label for a non-null root variant', ({ variant }) => {
    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({
          cartItemsSnapshot: [{ id: 'item-1', product: 'product-123', quantity: 1, variant }],
        }),
      ),
    ).toThrow()
  })

  it('should reject equivalent empty scalar and object relationship IDs', () => {
    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({
          cartItemsSnapshot: [{ id: 'item-1', product: 'product-123', quantity: 1, variant: '' }],
          transaction: createTransaction({
            items: [{ id: 'item-1', product: 'product-123', quantity: 1, variant: { id: '' } }],
          }),
        }),
      ),
    ).toThrow()
  })

  it('should preserve nested custom variant null when comparing against a missing nested key', () => {
    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({
          cartItemsSnapshot: [
            {
              id: 'item-1',
              product: 'product-123',
              quantity: 1,
              selection: { variant: null },
            },
          ],
          transaction: createTransaction({
            items: [{ id: 'item-1', product: 'product-123', quantity: 1, selection: {} }],
          }),
        }),
      ),
    ).toThrow('items')
  })

  it('should preserve nested custom values while ignoring object key order', () => {
    expect(() =>
      validateSettlement(
        createAuthenticatedValidation({
          cartItemsSnapshot: [
            {
              id: 'item-1',
              product: 'product-123',
              quantity: 1,
              selection: { color: 'blue', variant: null },
            },
          ],
          transaction: createTransaction({
            items: [
              {
                id: 'item-1',
                product: 'product-123',
                quantity: 1,
                selection: { variant: null, color: 'blue' },
              },
            ],
          }),
        }),
      ),
    ).not.toThrow()
  })

  it('should reject malformed item metadata', () => {
    expect(() =>
      validateSettlement(createAuthenticatedValidation({ cartItemsSnapshot: { quantity: 1 } })),
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
