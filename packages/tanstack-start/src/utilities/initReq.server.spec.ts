import type { PayloadRequest } from 'payload'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  accessUser: null as PayloadRequest['user'],
  applyUserReadAccess: vi.fn(async ({ user }: { user: NonNullable<PayloadRequest['user']> }) => ({
    collection: user.collection,
    id: user.id,
  })),
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

vi.mock('@tanstack/react-start/server', () => ({
  getRequest: () => new Request('http://localhost/admin'),
}))

vi.mock('payload', () => ({
  createLocalReq: vi.fn(async (options, payload) => {
    const user = options.user ?? options.req.user ?? null

    return {
      context: options.context ?? {},
      headers: options.req.headers,
      locale: 'en',
      payload,
      query: {},
      responseHeaders: options.req.responseHeaders,
      user: user && !user.collection ? { ...user, collection: payload.config.admin.user } : user,
    }
  }),
  executeAuthStrategies: vi.fn(async () => ({ user: mocks.user })),
  getAccessResults: vi.fn(async ({ req }: { req: PayloadRequest }) => {
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

vi.mock('./devConfigReload.server.js', () => ({}))

vi.mock('./getRequestLocale.js', () => ({
  getRequestLocale: vi.fn(async () => ({ code: 'en' })),
}))

import { initReq } from './initReq.server.js'

describe('initReq', () => {
  beforeEach(() => {
    mocks.accessUser = null
    mocks.applyUserReadAccess.mockClear()
  })

  it('should keep the complete req.user and return the user with read access', async () => {
    const result = await initReq({
      configPromise: {} as never,
      importMap: {},
      serverAdapter: { getHeaders: async () => new Headers() } as never,
    })

    expect(result.req.user).toHaveProperty('role', 'admin')
    expect(result.user).not.toHaveProperty('role')
    expect(mocks.accessUser).toHaveProperty('role', 'admin')
  })

  it('should preserve an explicit null user override', async () => {
    const result = await initReq({
      configPromise: {} as never,
      importMap: {},
      overrides: { user: null } as never,
      serverAdapter: { getHeaders: async () => new Headers() } as never,
    })

    expect(result.req.user).toBeNull()
    expect(result.user).toBeNull()
    expect(mocks.accessUser).toBeNull()
    expect(mocks.applyUserReadAccess).not.toHaveBeenCalled()
  })

  it('should preserve a normalized explicit user override', async () => {
    const result = await initReq({
      configPromise: {} as never,
      importMap: {},
      overrides: { user: { id: 'override-user' } } as never,
      serverAdapter: { getHeaders: async () => new Headers() } as never,
    })

    expect(result.req.user).toMatchObject({ collection: 'users', id: 'override-user' })
    expect(result.user).toBe(result.req.user)
    expect(mocks.accessUser).toBe(result.req.user)
    expect(mocks.applyUserReadAccess).not.toHaveBeenCalled()
  })
})
