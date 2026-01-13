import { describe, it, expect, vitest } from 'vitest'
import type { SanitizedEcommercePluginConfig } from '../types/index.js'

import { USD } from '../currencies/index.js'
import { getCollectionSlugMap } from './getCollectionSlugMap'

describe('getCollectionSlugMap', () => {
  const mockAccessConfig = {
    adminOnlyFieldAccess: vitest.fn(),
    adminOrPublishedStatus: vitest.fn(),
    customerOnlyFieldAccess: vitest.fn(),
    isAdmin: vitest.fn(),
    isAuthenticated: vitest.fn(),
    isDocumentOwner: vitest.fn(),
    publicAccess: vitest.fn(),
  }

  const baseConfig: SanitizedEcommercePluginConfig = {
    access: mockAccessConfig,
    addresses: {
      addressFields: [],
    },
    carts: true,
    currencies: {
      defaultCurrency: 'USD',
      supportedCurrencies: [USD],
    },
    customers: {
      slug: 'users',
    },
    orders: true,
    payments: {
      paymentMethods: [],
    },
    products: true,
    transactions: true,
  }

  it('should return default slug map when no overrides are provided', () => {
    const result = getCollectionSlugMap({ sanitizedPluginConfig: baseConfig })

    expect(result).toEqual({
      addresses: 'addresses',
      carts: 'carts',
      customers: 'users',
      orders: 'orders',
      products: 'products',
      transactions: 'transactions',
      variantOptions: 'variantOptions',
      variants: 'variants',
      variantTypes: 'variantTypes',
    })
  })

  it('should use custom customers slug when provided', () => {
    const config: SanitizedEcommercePluginConfig = {
      ...baseConfig,
      customers: {
        slug: 'custom-users',
      },
    }

    const result = getCollectionSlugMap({ sanitizedPluginConfig: config })

    expect(result.customers).toBe('custom-users')
  })

  it('should apply slugMap overrides', () => {
    const config: SanitizedEcommercePluginConfig = {
      ...baseConfig,
      slugMap: {
        products: 'custom-products',
        variants: 'custom-variants',
        orders: 'custom-orders',
      },
    }

    const result = getCollectionSlugMap({ sanitizedPluginConfig: config })

    expect(result.products).toBe('custom-products')
    expect(result.variants).toBe('custom-variants')
    expect(result.orders).toBe('custom-orders')
    // Other slugs should remain default
    expect(result.addresses).toBe('addresses')
    expect(result.carts).toBe('carts')
  })

  it('should prioritize slugMap overrides over customers slug', () => {
    const config: SanitizedEcommercePluginConfig = {
      ...baseConfig,
      customers: {
        slug: 'my-users',
      },
      slugMap: {
        customers: 'overridden-users',
      },
    }

    const result = getCollectionSlugMap({ sanitizedPluginConfig: config })

    expect(result.customers).toBe('overridden-users')
  })

  it('should handle partial slugMap overrides', () => {
    const config: SanitizedEcommercePluginConfig = {
      ...baseConfig,
      slugMap: {
        products: 'items',
      },
    }

    const result = getCollectionSlugMap({ sanitizedPluginConfig: config })

    expect(result.products).toBe('items')
    expect(result.addresses).toBe('addresses')
    expect(result.carts).toBe('carts')
    expect(result.customers).toBe('users')
    expect(result.orders).toBe('orders')
    expect(result.transactions).toBe('transactions')
    expect(result.variants).toBe('variants')
    expect(result.variantOptions).toBe('variantOptions')
    expect(result.variantTypes).toBe('variantTypes')
  })

  it('should handle empty slugMap', () => {
    const config: SanitizedEcommercePluginConfig = {
      ...baseConfig,
      slugMap: {},
    }

    const result = getCollectionSlugMap({ sanitizedPluginConfig: config })

    expect(result).toEqual({
      addresses: 'addresses',
      carts: 'carts',
      customers: 'users',
      orders: 'orders',
      products: 'products',
      transactions: 'transactions',
      variantOptions: 'variantOptions',
      variants: 'variants',
      variantTypes: 'variantTypes',
    })
  })

  it('should handle undefined slugMap', () => {
    const config: SanitizedEcommercePluginConfig = {
      ...baseConfig,
      slugMap: undefined,
    }

    const result = getCollectionSlugMap({ sanitizedPluginConfig: config })

    expect(result).toEqual({
      addresses: 'addresses',
      carts: 'carts',
      customers: 'users',
      orders: 'orders',
      products: 'products',
      transactions: 'transactions',
      variantOptions: 'variantOptions',
      variants: 'variants',
      variantTypes: 'variantTypes',
    })
  })
})
