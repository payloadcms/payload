import type { I18nClient } from '@payloadcms/translations'

import type { SanitizedConfig } from './types.js'

import { describe, expect, it } from 'vitest'

import type { ClientConfig } from './client.js'
import { createClientConfig, createUnauthenticatedClientConfig } from './client.js'

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
    })

    expect(clientConfig).not.toHaveProperty('baseAccess')
  })
})

describe('createUnauthenticatedClientConfig', () => {
  const mockClientConfig = {
    admin: {
      autoLogin: { email: 'test@example.com' },
      autoRefresh: true,
      avatar: 'gravatar',
      dateFormat: 'yyyy-MM-dd',
      meta: { titleSuffix: '- Admin' },
      routes: {
        account: '/account',
        createFirstUser: '/create-first-user',
        forgot: '/forgot',
        inactivity: '/inactivity',
        login: '/login',
        logout: '/logout',
        reset: '/reset',
        unauthorized: '/unauthorized',
      },
      theme: 'dark',
      user: 'users',
    },
    collections: [
      {
        slug: 'users',
        auth: {
          disableLocalStrategy: false,
          loginWithUsername: false,
        },
        fields: [
          {
            name: 'email',
            type: 'email',
          },
        ],
      },
    ],
    globals: [],
    routes: {
      admin: '/admin',
      api: '/api',
    },
    serverURL: 'http://localhost:3000',
  } as unknown as ClientConfig

  it('preserves admin config properties such as theme, routes, and autoLogin', () => {
    const unauthConfig = createUnauthenticatedClientConfig({
      clientConfig: mockClientConfig,
    })

    expect(unauthConfig.unauthenticated).toBe(true)
    expect(unauthConfig.admin.theme).toBe('dark')
    expect(unauthConfig.admin.user).toBe('users')
    expect(unauthConfig.admin.routes.login).toBe('/login')
    expect(unauthConfig.admin.autoLogin).toEqual({ email: 'test@example.com' })
  })

  it('includes the admin user collection config and handles missing collection gracefully', () => {
    const unauthConfig = createUnauthenticatedClientConfig({
      clientConfig: mockClientConfig,
    })

    expect(unauthConfig.collections).toHaveLength(1)
    expect(unauthConfig.collections[0].slug).toBe('users')

    const configWithoutUserCollection = {
      ...mockClientConfig,
      collections: [],
    } as unknown as ClientConfig

    const unauthConfigEmpty = createUnauthenticatedClientConfig({
      clientConfig: configWithoutUserCollection,
    })

    expect(unauthConfigEmpty.collections).toHaveLength(0)
  })
})
