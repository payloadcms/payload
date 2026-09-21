import type { PayloadRequest } from 'payload'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  accessContexts: [] as unknown[],
  accessUser: null as PayloadRequest['user'],
  applyUserReadAccess: vi.fn(),
  cacheStores: new Map<string, Array<{ args: unknown[]; value: object }>>(),
  executeAuthStrategies: vi.fn(),
  user: {
    collection: 'users',
    id: 'user-id',
    role: 'admin',
  } as PayloadRequest['user'],
}))

vi.mock('@payloadcms/translations', () => ({
  initI18n: vi.fn(async () => ({
    fallbackLanguage: 'en',
    language: 'en',
    t: (key: string) => key,
    translations: {},
  })),
}))

vi.mock('payload', () => ({
  createLocalReq: vi.fn(async (options, payload) => {
    const request = options.req ?? {}
    const user = options.user ?? request.user ?? null

    return {
      ...request,
      context: options.context ?? request.context ?? {},
      headers: request.headers ?? new Headers(),
      locale: options.locale ?? request.locale ?? 'en',
      pathname: options.urlSuffix,
      payload,
      query: request.query ?? {},
      responseHeaders: request.responseHeaders ?? new Headers(),
      user: user && !user.collection ? { ...user, collection: payload.config.admin.user } : user,
    }
  }),
  executeAuthStrategies: mocks.executeAuthStrategies,
  getAccessResults: vi.fn(async ({ req }: { req: PayloadRequest }) => {
    mocks.accessContexts.push(req.context.name)
    mocks.accessUser = req.user
    return {}
  }),
  getPayload: vi.fn(async () => ({
    collections: {
      users: {
        config: {
          auth: { depth: 1 },
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
  parseCookies: vi.fn(() => new Map()),
}))

vi.mock('payload/internal', () => ({
  applyUserReadAccess: mocks.applyUserReadAccess,
}))

vi.mock('./getRequestLocale.js', () => ({
  getRequestLocale: vi.fn(async ({ req }: { req: PayloadRequest }) => ({
    code: req.locale,
  })),
}))

vi.mock('./selectiveCache.js', () => ({
  selectiveCache: (namespace: string) => ({
    get: async (factory: () => Promise<object>, ...args: unknown[]) => {
      let entries = mocks.cacheStores.get(namespace)

      if (!entries) {
        entries = []
        mocks.cacheStores.set(namespace, entries)
      }

      const cached = entries.find(
        (entry) =>
          entry.args.length === args.length && entry.args.every((arg, i) => arg === args[i]),
      )

      if (cached) {
        return cached.value
      }

      const value = await factory()
      entries.push({ args, value })

      return value
    },
  }),
}))

import { initReq } from './initReq.js'

describe('initReq', () => {
  beforeEach(() => {
    mocks.accessContexts = []
    mocks.accessUser = null
    mocks.applyUserReadAccess.mockReset()
    mocks.applyUserReadAccess.mockImplementation(async ({ req, user }) => ({
      collection: user.collection,
      id: user.id,
      name: req.context.name,
    }))
    mocks.cacheStores.clear()
    mocks.executeAuthStrategies.mockReset()
    mocks.executeAuthStrategies.mockResolvedValue({ user: mocks.user })
  })

  it('should keep the complete req.user and filter the user for each response', async () => {
    const first = await initReq({
      configPromise: {} as never,
      importMap: {},
      key: 'response',
      overrides: { context: { name: 'First' } },
      serverAdapter: { getHeaders: async () => new Headers() } as never,
    })
    const second = await initReq({
      configPromise: {} as never,
      importMap: {},
      key: 'response',
      overrides: { context: { name: 'Second' } },
      serverAdapter: { getHeaders: async () => new Headers() } as never,
    })

    expect(mocks.executeAuthStrategies).toHaveBeenCalledOnce()
    expect(mocks.applyUserReadAccess).toHaveBeenCalledTimes(2)
    expect(first.req.user).toHaveProperty('role', 'admin')
    expect(second.req.user).toHaveProperty('role', 'admin')
    expect(first.user).toMatchObject({ name: 'First' })
    expect(second.user).toMatchObject({ name: 'Second' })
    expect(first.user).not.toHaveProperty('role')
    expect(mocks.accessUser).toHaveProperty('role', 'admin')
    expect(mocks.accessContexts).toEqual(['First', 'Second'])
  })

  it('should use anonymous access when user read access fails', async () => {
    mocks.applyUserReadAccess.mockRejectedValue(new Error('read access failed'))

    const result = await initReq({
      configPromise: {} as never,
      importMap: {},
      key: 'failure',
      serverAdapter: { getHeaders: async () => new Headers() } as never,
    })

    expect(result.req.user).toBeNull()
    expect(result.user).toBeNull()
    expect(mocks.accessUser).toBeNull()
  })

  it('should preserve an explicit req.user override', async () => {
    const user = { id: 'override-user' }

    const result = await initReq({
      configPromise: {} as never,
      importMap: {},
      key: 'override',
      overrides: { req: { user } as never },
      serverAdapter: { getHeaders: async () => new Headers() } as never,
    })

    expect(result.req.user).toMatchObject({ collection: 'users', id: 'override-user' })
    expect(result.user).toBe(result.req.user)
    expect(mocks.applyUserReadAccess).not.toHaveBeenCalled()
  })

  it('should preserve an explicit null user override', async () => {
    const result = await initReq({
      configPromise: {} as never,
      importMap: {},
      key: 'anonymous',
      overrides: { user: null } as never,
      serverAdapter: { getHeaders: async () => new Headers() } as never,
    })

    expect(result.req.user).toBeNull()
    expect(result.user).toBeNull()
    expect(mocks.applyUserReadAccess).not.toHaveBeenCalled()
  })
})
