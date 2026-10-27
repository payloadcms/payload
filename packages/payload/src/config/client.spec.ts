import type { I18nClient } from '@payloadcms/translations'

import type { SanitizedConfig } from './types.js'

import { describe, expect, it } from 'vitest'

import { createClientConfig } from './client.js'

describe('createClientConfig', () => {
  it('should omit baseAccess from the client config', () => {
    const clientConfig = createClientConfig({
      config: {
        baseAccess: {
          collections: {
            read: () => true,
          },
        },
      } as SanitizedConfig,
      i18n: {} as I18nClient,
      importMap: {},
      user: true,
    })

    expect(clientConfig).not.toHaveProperty('baseAccess')
  })

  it('should omit branch access functions from the client config', () => {
    const clientConfig = createClientConfig({
      config: {
        branching: {
          access: {
            discardBranch: () => true,
            mergeBranch: () => true,
          },
          branchableCollections: new Set(['pages']),
          branchableGlobals: new Set(['header']),
          enabled: true,
        },
      } as SanitizedConfig,
      i18n: {} as I18nClient,
      importMap: {},
    })

    expect(clientConfig.branching).toEqual({
      branchableCollections: ['pages'],
      branchableGlobals: ['header'],
      enabled: true,
    })
    expect(clientConfig.branching).not.toHaveProperty('access')
  })
})
