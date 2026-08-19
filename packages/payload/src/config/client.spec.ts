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
})
