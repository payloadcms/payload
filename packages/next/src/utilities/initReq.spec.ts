import type { PayloadRequest } from 'payload'

import { getAccessResults } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'

type CacheEntry = {
  children: Map<unknown, CacheEntry>
  value?: object
}

const mocks = vi.hoisted(() => ({
  applyUserReadAccess: vi.fn(
    async ({ req, user }: { req: PayloadRequest; user: NonNullable<PayloadRequest['user']> }) => {
      mocks.readAccessCalls += 1

      if (!mocks.readAccessSucceeds) {
        throw new Error('User read access failed')
      }

      const userWithReadAccess = {
        ...user,
        requestLocale: req.locale,
      }

      delete userWithReadAccess.authorizationRole

      return userWithReadAccess
    },
  ),
  authenticationSucceeds: true,
  cacheStores: new Map<string, CacheEntry>(),
  executeAuthStrategies: vi.fn(async () => ({
    responseHeaders: new Headers({ 'x-auth': 'authenticated' }),
    user: mocks.authenticationSucceeds
      ? {
          authorizationRole: 'admin',
          collection: 'users',
          id: 'user-id',
        }
      : null,
  })),
  readAccessCalls: 0,
  readAccessSucceeds: true,
}))

vi.mock('@payloadcms/translations', () => ({
  initI18n: vi.fn(async () => ({
    dateFNSKey: 'en-US',
    fallbackLanguage: 'en',
    language: 'en',
    t: (key: string) => key,
    translations: {},
  })),
}))

vi.mock('next/headers.js', () => ({
  headers: vi.fn(async () => new Headers()),
}))

vi.mock('payload', async (importOriginal) => {
  const payloadModule = await importOriginal<typeof import('payload')>()

  return {
    ...payloadModule,
    createLocalReq: vi.fn(async (options, payload) => {
      const request = options.req ?? {}
      const url = new URL(options.urlSuffix ?? '/', 'http://localhost')
      const user = options.user ?? request.user ?? null

      return {
        ...request,
        context: options.context ?? request.context ?? {},
        fallbackLocale: options.fallbackLocale,
        headers: request.headers ?? new Headers(),
        locale: options.locale ?? request.locale ?? request.query?.locale ?? 'en',
        pathname: request.pathname ?? url.pathname,
        payload,
        query: request.query ?? {},
        responseHeaders: request.responseHeaders ?? new Headers(),
        url: request.url ?? url.href,
        user: user && !user.collection ? { ...user, collection: payload.config.admin.user } : user,
      }
    }),
    executeAuthStrategies: mocks.executeAuthStrategies,
    getAccessResults: vi.fn(async ({ req }: { req: PayloadRequest }) => ({
      canAccessAdmin: req.user?.authorizationRole === 'admin',
    })),
    getPayload: vi.fn(async () => ({
      collections: {
        users: {
          config: {
            auth: { depth: 0 },
            slug: 'users',
          },
        },
      },
      config: {
        admin: { user: 'users' },
        i18n: {
          fallbackLanguage: 'en',
          supportedLanguages: { en: {} },
          translations: {},
        },
      },
      logger: { error: vi.fn() },
    })),
    getRequestLanguage: vi.fn(() => 'en'),
  }
})

vi.mock('payload/internal', () => ({
  applyUserReadAccess: mocks.applyUserReadAccess,
}))

vi.mock('./getRequestLocale.js', () => ({
  getRequestLocale: vi.fn(async ({ req }: { req: PayloadRequest }) => ({
    code: req.locale ?? 'en',
  })),
}))

vi.mock('./selectiveCache.js', () => ({
  selectiveCache: (namespace: string) => ({
    get: async (factory: () => Promise<object>, ...args: unknown[]) => {
      let cacheEntry = mocks.cacheStores.get(namespace)

      if (!cacheEntry) {
        cacheEntry = { children: new Map() }
        mocks.cacheStores.set(namespace, cacheEntry)
      }

      for (const arg of args) {
        let child = cacheEntry.children.get(arg)

        if (!child) {
          child = { children: new Map() }
          cacheEntry.children.set(arg, child)
        }

        cacheEntry = child
      }

      if (!('value' in cacheEntry)) {
        cacheEntry.value = await factory()
      }

      return cacheEntry.value
    },
  }),
}))

import { initReq } from './initReq.js'

describe('initReq', () => {
  beforeEach(() => {
    mocks.authenticationSucceeds = true
    mocks.applyUserReadAccess.mockClear()
    mocks.cacheStores.clear()
    mocks.executeAuthStrategies.mockClear()
    mocks.readAccessCalls = 0
    mocks.readAccessSucceeds = true
  })

  it('should authenticate once and apply user read access for each request shape', async () => {
    const first = await initReq({
      configPromise: {} as never,
      importMap: {},
      key: 'shared-request',
      overrides: { locale: 'en' },
    })
    const second = await initReq({
      configPromise: {} as never,
      importMap: {},
      key: 'shared-request',
      overrides: { locale: 'fr' },
    })

    expect(mocks.executeAuthStrategies).toHaveBeenCalledOnce()
    expect(mocks.readAccessCalls).toBe(2)
    expect(first.user).toMatchObject({ requestLocale: 'en' })
    expect(second.user).toMatchObject({ requestLocale: 'fr' })
    expect(first.req.user).toHaveProperty('authorizationRole', 'admin')
    expect(second.req.user).toHaveProperty('authorizationRole', 'admin')
  })

  it('should preserve complete fields for subsequent access checks', async () => {
    const result = await initReq({
      configPromise: {} as never,
      importMap: {},
      key: 'subsequent-access',
    })

    const subsequentPermissions = await getAccessResults({ req: result.req })

    expect(result.req.user).toHaveProperty('authorizationRole', 'admin')
    expect(result.user).not.toHaveProperty('authorizationRole')
    expect(subsequentPermissions.canAccessAdmin).toBe(true)
  })

  it('should clear authentication when client user processing fails', async () => {
    mocks.readAccessSucceeds = false

    const result = await initReq({
      configPromise: {} as never,
      importMap: {},
      key: 'failed-user-read',
    })

    expect(result.user).toBeNull()
    expect(result.req.user).toBeNull()
    expect(result.permissions.canAccessAdmin).toBe(false)
  })

  it('should preserve an explicit user override without applying read access', async () => {
    const user = { authorizationRole: 'admin', collection: 'users', id: 'override-user' }

    const result = await initReq({
      configPromise: {} as never,
      importMap: {},
      key: 'user-override',
      overrides: { user },
    })

    expect(mocks.applyUserReadAccess).not.toHaveBeenCalled()
    expect(result.user).toBe(user)
    expect(result.req.user).toBe(user)
    expect(result.permissions.canAccessAdmin).toBe(true)
  })

  it('should preserve an explicit top-level null user override', async () => {
    const result = await initReq({
      configPromise: {} as never,
      importMap: {},
      key: 'top-level-null-user-override',
      overrides: { user: null },
    })

    expect(mocks.applyUserReadAccess).not.toHaveBeenCalled()
    expect(result.user).toBeNull()
    expect(result.req.user).toBeNull()
    expect(result.permissions.canAccessAdmin).toBe(false)
  })
})
