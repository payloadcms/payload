import type { I18nClient } from '@payloadcms/translations'

import type { SanitizedConfig } from './types.js'
import type { ClientConfig } from './client.js'

import { describe, expect, it } from 'vitest'

import { createClientConfig, createUnauthenticatedClientConfig } from './client.js'

describe('createUnauthenticatedClientConfig', () => {
  it.each(['payload', 'my-app'])(
    'should preserve cookiePrefix %s for unauthenticated clients',
    (cookiePrefix) => {
      const clientConfig = {
        admin: { routes: {}, user: 'users' },
        collections: [{ slug: 'users', auth: {} }],
        cookiePrefix,
        globals: [],
        routes: {
          admin: '/admin',
          api: '/api',
          graphQL: '/graphql',
          graphQLPlayground: '/graphql-playground',
        },
        serverURL: 'https://example.com',
      } as ClientConfig

      const unauthenticatedConfig = createUnauthenticatedClientConfig({ clientConfig })

      expect(unauthenticatedConfig).toMatchObject({ cookiePrefix })
    },
  )
})

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
