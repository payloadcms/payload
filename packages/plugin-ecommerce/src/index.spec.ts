import type { Config } from 'payload'

import { describe, expect, it, vitest } from 'vitest'

import { ecommercePlugin } from './index.js'

describe('ecommercePlugin i18n translations', () => {
  const mockAccessConfig = {
    adminOnlyFieldAccess: vitest.fn(),
    adminOrPublishedStatus: vitest.fn(),
    customerOnlyFieldAccess: vitest.fn(),
    isAdmin: vitest.fn(),
    isAuthenticated: vitest.fn(),
    isDocumentOwner: vitest.fn(),
  }

  it('should preserve user-provided translations for the plugin-ecommerce namespace', async () => {
    const plugin = ecommercePlugin({
      access: mockAccessConfig,
      customers: { slug: 'users' },
    })

    const incomingConfig = {
      collections: [],
      i18n: {
        translations: {
          en: {
            'plugin-ecommerce': {
              cart: 'MY CART OVERRIDE',
            },
          },
        },
      },
    } as unknown as Config

    const result = await plugin(incomingConfig)

    // User override wins...
    expect((result.i18n?.translations?.en as any)['plugin-ecommerce'].cart).toBe('MY CART OVERRIDE')
    // ...while other plugin defaults for the namespace are still present.
    expect((result.i18n?.translations?.en as any)['plugin-ecommerce'].customer).toBe('Customer')
  })
})
