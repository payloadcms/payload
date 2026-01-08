import { describe, it, expect, vitest } from 'vitest'
import type { EcommercePluginConfig } from '../types/index.js'

import { EUR, USD } from '../currencies/index.js'
import { sanitizePluginConfig } from './sanitizePluginConfig'

describe('sanitizePluginConfig', () => {
  const mockAccessConfig = {
    adminOnlyFieldAccess: vitest.fn(),
    adminOrPublishedStatus: vitest.fn(),
    customerOnlyFieldAccess: vitest.fn(),
    isAdmin: vitest.fn(),
    isAuthenticated: vitest.fn(),
    isDocumentOwner: vitest.fn(),
  }

  const minimalConfig: EcommercePluginConfig = {
    access: mockAccessConfig,
    customers: {
      slug: 'users',
    },
  }

  describe('customers', () => {
    it('should default customers slug to "users" when undefined', () => {
      const config: EcommercePluginConfig = {
        access: mockAccessConfig,
        customers: undefined as any,
      }

      const result = sanitizePluginConfig({ pluginConfig: config })

      expect(result.customers).toEqual({
        slug: 'users',
      })
    })

    it('should preserve custom customers slug', () => {
      const config: EcommercePluginConfig = {
        ...minimalConfig,
        customers: {
          slug: 'custom-users',
        },
      }

      const result = sanitizePluginConfig({ pluginConfig: config })

      expect(result.customers.slug).toBe('custom-users')
    })
  })

  describe('addresses', () => {
    it('should create default addresses config when undefined', () => {
      const result = sanitizePluginConfig({ pluginConfig: minimalConfig })

      expect(result.addresses).toBeDefined()
      expect(result.addresses.addressFields).toBeDefined()
      expect(Array.isArray(result.addresses.addressFields)).toBe(true)
      expect(result.addresses.addressFields.length).toBeGreaterThan(0)
    })

    it('should create default addresses config when set to true', () => {
      const config: EcommercePluginConfig = {
        ...minimalConfig,
        addresses: true,
      }

      const result = sanitizePluginConfig({ pluginConfig: config })

      expect(result.addresses).toBeDefined()
      expect(result.addresses.addressFields).toBeDefined()
      expect(Array.isArray(result.addresses.addressFields)).toBe(true)
    })

    it('should use custom addressFields function', () => {
      const customField = {
        name: 'customField',
        type: 'text' as const,
      }

      const config: EcommercePluginConfig = {
        ...minimalConfig,
        addresses: {
          addressFields: ({ defaultFields }) => [...defaultFields, customField],
        },
      }

      const result = sanitizePluginConfig({ pluginConfig: config })

      expect(result.addresses.addressFields).toBeDefined()
      const lastField = result.addresses.addressFields[result.addresses.addressFields.length - 1]
      expect(lastField).toEqual(customField)
    })

    it('should preserve other address config properties', () => {
      const config: EcommercePluginConfig = {
        ...minimalConfig,
        addresses: {
          addressFields: ({ defaultFields }) => defaultFields,
          supportedCountries: [
            { label: 'United States', value: 'US' },
            { label: 'Canada', value: 'CA' },
          ],
        },
      }

      const result = sanitizePluginConfig({ pluginConfig: config })

      expect(result.addresses.supportedCountries).toEqual([
        { label: 'United States', value: 'US' },
        { label: 'Canada', value: 'CA' },
      ])
    })
  })

  describe('currencies', () => {
    it('should default to USD when undefined', () => {
      const result = sanitizePluginConfig({ pluginConfig: minimalConfig })

      expect(result.currencies).toEqual({
        defaultCurrency: 'USD',
        supportedCurrencies: [USD],
      })
    })

    it('should preserve custom currencies config', () => {
      const config: EcommercePluginConfig = {
        ...minimalConfig,
        currencies: {
          defaultCurrency: 'EUR',
          supportedCurrencies: [USD, EUR],
        },
      }

      const result = sanitizePluginConfig({ pluginConfig: config })

      expect(result.currencies).toEqual({
        defaultCurrency: 'EUR',
        supportedCurrencies: [USD, EUR],
      })
    })
  })

  describe('inventory', () => {
    it('should default inventory config when undefined', () => {
      const result = sanitizePluginConfig({ pluginConfig: minimalConfig })

      expect(result.inventory).toEqual({
        fieldName: 'inventory',
      })
    })

    it('should default inventory config when set to true', () => {
      const config: EcommercePluginConfig = {
        ...minimalConfig,
        inventory: true,
      }

      const result = sanitizePluginConfig({ pluginConfig: config })

      expect(result.inventory).toEqual({
        fieldName: 'inventory',
      })
    })

    it('should preserve custom inventory config', () => {
      const config: EcommercePluginConfig = {
        ...minimalConfig,
        inventory: {
          fieldName: 'stock',
        },
      }

      const result = sanitizePluginConfig({ pluginConfig: config })

      expect(result.inventory).toEqual({
        fieldName: 'stock',
      })
    })

    it('should allow disabling inventory with false', () => {
      const config: EcommercePluginConfig = {
        ...minimalConfig,
        inventory: false,
      }

      const result = sanitizePluginConfig({ pluginConfig: config })

      expect(result.inventory).toBe(false)
    })
  })

  describe('carts', () => {
    it('should default carts to object with allowGuestCarts true when undefined', () => {
      const result = sanitizePluginConfig({ pluginConfig: minimalConfig })

      expect(result.carts).toEqual({
        allowGuestCarts: true,
      })
    })

    it('should convert carts true to object with allowGuestCarts true', () => {
      const config: EcommercePluginConfig = {
        ...minimalConfig,
        carts: true,
      }

      const result = sanitizePluginConfig({ pluginConfig: config })

      expect(result.carts).toEqual({
        allowGuestCarts: true,
      })
    })

    it('should preserve carts false', () => {
      const config: EcommercePluginConfig = {
        ...minimalConfig,
        carts: false,
      }

      const result = sanitizePluginConfig({ pluginConfig: config })

      expect(result.carts).toBe(false)
    })

    it('should default allowGuestCarts to true when carts is object without it', () => {
      const config: EcommercePluginConfig = {
        ...minimalConfig,
        carts: {} as any,
      }

      const result = sanitizePluginConfig({ pluginConfig: config })

      expect(result.carts).toEqual({
        allowGuestCarts: true,
      })
    })

    it('should preserve explicit allowGuestCarts false', () => {
      const config: EcommercePluginConfig = {
        ...minimalConfig,
        carts: {
          allowGuestCarts: false,
        },
      }

      const result = sanitizePluginConfig({ pluginConfig: config })

      expect(result.carts).toEqual({
        allowGuestCarts: false,
      })
    })

    it('should preserve other carts config properties', () => {
      const config: EcommercePluginConfig = {
        ...minimalConfig,
        carts: {
          allowGuestCarts: false,
          cartsCollectionOverride: vitest.fn() as any,
        },
      }

      const result = sanitizePluginConfig({ pluginConfig: config })

      expect(result.carts).toHaveProperty('allowGuestCarts', false)
      expect(result.carts).toHaveProperty('cartsCollectionOverride')
    })
  })

  describe('orders', () => {
    it('should default orders to true when undefined', () => {
      const result = sanitizePluginConfig({ pluginConfig: minimalConfig })

      expect(result.orders).toBe(true)
    })

    it('should preserve orders config', () => {
      const config: EcommercePluginConfig = {
        ...minimalConfig,
        orders: false,
      }

      const result = sanitizePluginConfig({ pluginConfig: config })

      expect(result.orders).toBe(false)
    })
  })

  describe('transactions', () => {
    it('should default transactions to true when undefined', () => {
      const result = sanitizePluginConfig({ pluginConfig: minimalConfig })

      expect(result.transactions).toBe(true)
    })

    it('should preserve transactions config', () => {
      const config: EcommercePluginConfig = {
        ...minimalConfig,
        transactions: false,
      }

      const result = sanitizePluginConfig({ pluginConfig: config })

      expect(result.transactions).toBe(false)
    })
  })

  describe('payments', () => {
    it('should default payments to empty array when undefined', () => {
      const result = sanitizePluginConfig({ pluginConfig: minimalConfig })

      expect(result.payments).toEqual({
        paymentMethods: [],
      })
    })

    it('should default paymentMethods to empty array when not provided', () => {
      const config: EcommercePluginConfig = {
        ...minimalConfig,
        payments: {} as any,
      }

      const result = sanitizePluginConfig({ pluginConfig: config })

      expect(result.payments.paymentMethods).toEqual([])
    })

    it('should preserve payment methods', () => {
      const mockAdapter = {
        name: 'stripe',
        label: 'Stripe',
      } as any

      const config: EcommercePluginConfig = {
        ...minimalConfig,
        payments: {
          paymentMethods: [mockAdapter],
        },
      }

      const result = sanitizePluginConfig({ pluginConfig: config })

      expect(result.payments.paymentMethods).toEqual([mockAdapter])
    })
  })

  describe('products', () => {
    it('should default variants to true when products is object and variants is undefined', () => {
      const config: EcommercePluginConfig = {
        ...minimalConfig,
        products: {},
      }

      const result = sanitizePluginConfig({ pluginConfig: config })

      expect(result.products).toEqual({
        variants: true,
      })
    })

    it('should preserve variants config when provided', () => {
      const config: EcommercePluginConfig = {
        ...minimalConfig,
        products: {
          variants: false,
        },
      }

      const result = sanitizePluginConfig({ pluginConfig: config })

      expect(result.products).toEqual({
        variants: false,
      })
    })

    it('should not modify products when set to true', () => {
      const config: EcommercePluginConfig = {
        ...minimalConfig,
        products: true,
      }

      const result = sanitizePluginConfig({ pluginConfig: config })

      expect(result.products).toBe(true)
    })

    it('should not modify products when set to false', () => {
      const config: EcommercePluginConfig = {
        ...minimalConfig,
        products: false,
      }

      const result = sanitizePluginConfig({ pluginConfig: config })

      expect(result.products).toBe(false)
    })
  })

  describe('access', () => {
    it('should provide default isAuthenticated function', () => {
      const result = sanitizePluginConfig({ pluginConfig: minimalConfig })

      expect(result.access.isAuthenticated).toBeDefined()
      expect(typeof result.access.isAuthenticated).toBe('function')
    })

    it('should provide default publicAccess function', () => {
      const result = sanitizePluginConfig({ pluginConfig: minimalConfig })

      expect(result.access.publicAccess).toBeDefined()
      expect(typeof result.access.publicAccess).toBe('function')
    })

    it('should allow user-provided access functions to override defaults', () => {
      const customIsAuthenticated = vitest.fn()
      const customPublicAccess = vitest.fn()

      const config: EcommercePluginConfig = {
        ...minimalConfig,
        access: {
          ...mockAccessConfig,
          isAuthenticated: customIsAuthenticated,
          publicAccess: customPublicAccess,
        },
      }

      const result = sanitizePluginConfig({ pluginConfig: config })

      expect(result.access.isAuthenticated).toBe(customIsAuthenticated)
      expect(result.access.publicAccess).toBe(customPublicAccess)
    })

    it('should preserve all user-provided access functions', () => {
      const result = sanitizePluginConfig({ pluginConfig: minimalConfig })

      expect(result.access.adminOnlyFieldAccess).toBe(mockAccessConfig.adminOnlyFieldAccess)
      expect(result.access.adminOrPublishedStatus).toBe(mockAccessConfig.adminOrPublishedStatus)
      expect(result.access.customerOnlyFieldAccess).toBe(mockAccessConfig.customerOnlyFieldAccess)
      expect(result.access.isAdmin).toBe(mockAccessConfig.isAdmin)
      expect(result.access.isDocumentOwner).toBe(mockAccessConfig.isDocumentOwner)
    })

    it('default publicAccess should always return true', () => {
      const result = sanitizePluginConfig({ pluginConfig: minimalConfig })

      // @ts-expect-error - ignoring for test
      expect(result.access.publicAccess()).toBe(true)
    })

    it('default isAuthenticated should be provided', () => {
      const result = sanitizePluginConfig({ pluginConfig: minimalConfig })

      expect(result.access.isAuthenticated).toBeDefined()
      expect(typeof result.access.isAuthenticated).toBe('function')
    })
  })

  describe('complete config', () => {
    it('should handle a fully configured plugin', () => {
      const fullConfig: EcommercePluginConfig = {
        access: mockAccessConfig,
        addresses: {
          addressFields: ({ defaultFields }) => defaultFields,
          supportedCountries: [{ label: 'US', value: 'US' }],
        },
        carts: {
          allowGuestCarts: true,
        },
        currencies: {
          defaultCurrency: 'EUR',
          supportedCurrencies: [USD, EUR],
        },
        customers: {
          slug: 'customers',
        },
        inventory: {
          fieldName: 'stock',
        },
        orders: true,
        payments: {
          paymentMethods: [],
        },
        products: {
          variants: true,
        },
        slugMap: {
          products: 'items',
        },
        transactions: true,
      }

      const result = sanitizePluginConfig({ pluginConfig: fullConfig })

      expect(result.customers.slug).toBe('customers')
      expect(result.currencies.defaultCurrency).toBe('EUR')
      expect(result.inventory).toEqual({ fieldName: 'stock' })
      expect(result.carts).toHaveProperty('allowGuestCarts', true)
      expect(result.orders).toBe(true)
      expect(result.transactions).toBe(true)
      expect(result.products).toEqual({ variants: true })
      expect(result.slugMap).toEqual({ products: 'items' })
    })
  })
})
