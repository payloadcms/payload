import type { I18nClient } from '@payloadcms/translations'
import type { ImportMap } from '../bin/generateImportMap/index.js'
import type { SanitizedConfig } from '../config/types.js'
import type { Payload } from '../index.js'
import type { ServerAdapter } from './adapters/server.js'
import type { InitReqCache, InitReqPartialResult } from './initReq.js'
import type { InitReqResult } from './functions/index.js'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { initReq } from './initReq.js'

const { getAccessResults, getPayload, initI18n } = vi.hoisted(() => ({
  getAccessResults: vi.fn(),
  getPayload: vi.fn(),
  initI18n: vi.fn(),
}))

vi.mock('../index.js', () => ({
  getPayload,
}))

vi.mock('../auth/getAccessResults.js', () => ({
  getAccessResults,
}))

vi.mock('@payloadcms/translations', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@payloadcms/translations')>()

  return {
    ...actual,
    initI18n,
  }
})

const config = {
  cookiePrefix: 'payload',
  i18n: {
    fallbackLanguage: 'en',
    supportedLanguages: {
      en: {},
    },
  },
  localization: false,
  serverURL: 'https://configured.example.com',
} as SanitizedConfig

const importMap = {} as ImportMap
const permissions = {
  canAccessAdmin: true,
  collections: {},
  globals: {},
}
const i18n = {
  language: 'en',
  t: (key: string) => key,
  translations: {},
} as unknown as I18nClient
const authenticate = vi.fn().mockResolvedValue({
  responseHeaders: new Headers({ 'x-auth': 'authenticated' }),
  user: {
    collection: 'users',
    id: 'user-id',
  },
})
const payload = {
  authStrategies: [
    {
      authenticate,
      name: 'test',
    },
  ],
  config,
  logger: {
    error: vi.fn(),
  },
} as unknown as Payload
const headers = new Headers({
  cookie: 'payload-lng=en; token=abc',
  host: 'example.com',
})
const serverAdapter = {
  forbidden: vi.fn(),
  getCookies: vi.fn(),
  getHeaders: vi.fn().mockResolvedValue(headers),
  notFound: vi.fn(),
  permanentRedirect: vi.fn(),
  redirect: vi.fn(),
  setCookie: vi.fn(),
  unauthorized: vi.fn(),
} as unknown as ServerAdapter

const createExecutingCache = (): InitReqCache => ({
  getPartial: vi.fn((factory: () => Promise<InitReqPartialResult>) => factory()),
  getRequest: vi.fn((factory: () => Promise<InitReqResult>) => factory()),
})

const createReusingCache = (): InitReqCache => {
  let partialResult: InitReqPartialResult | undefined
  const requestResults = new Map<string, InitReqResult>()

  return {
    getPartial: vi.fn(async (factory) => {
      partialResult ??= await factory()
      return partialResult
    }),
    getRequest: vi.fn(async (factory, key) => {
      if (!requestResults.has(key)) {
        requestResults.set(key, await factory())
      }
      return requestResults.get(key)!
    }),
  }
}

describe('initReq', () => {
  beforeEach(() => {
    authenticate.mockClear()
    getAccessResults.mockReset().mockResolvedValue(permissions)
    getPayload.mockReset().mockResolvedValue(payload)
    initI18n.mockReset().mockResolvedValue(i18n)
  })

  it('should derive the URL and a nested query from requestURL', async () => {
    const result = await initReq({
      configPromise: config,
      importMap,
      requestURL: 'https://example.com/admin?locale=es&where%5Btitle%5D%5Bequals%5D=Hello',
      serverAdapter,
    })

    expect(result.req.url).toBe(
      'https://example.com/admin?locale=es&where%5Btitle%5D%5Bequals%5D=Hello',
    )
    expect(result.req.query).toEqual({
      locale: 'es',
      where: {
        title: {
          equals: 'Hello',
        },
      },
    })
  })

  it('should prefer explicit request overrides over requestURL', async () => {
    const result = await initReq({
      configPromise: config,
      importMap,
      overrides: {
        req: {
          query: {
            locale: 'de',
          },
          url: 'https://override.example.com/admin',
        },
      },
      requestURL: 'https://example.com/admin?locale=es',
      serverAdapter,
    })

    expect(result.req.url).toBe('https://override.example.com/admin')
    expect(result.req.query).toEqual({
      locale: 'de',
    })
  })

  it('should ignore an invalid requestURL', async () => {
    const result = await initReq({
      configPromise: config,
      importMap,
      requestURL: 'not a valid URL',
      serverAdapter,
    })

    expect(result.req.url).toBe('https://configured.example.com/')
    expect(result.req.query).toEqual({})
  })

  it('should initialize each request directly when no cache is supplied', async () => {
    await initReq({ configPromise: config, importMap, serverAdapter })
    await initReq({ configPromise: config, importMap, serverAdapter })

    expect(authenticate).toHaveBeenCalledTimes(2)
    expect(getAccessResults).toHaveBeenCalledTimes(2)
  })

  it('should use both cache stages when a cache is supplied', async () => {
    const cache = createExecutingCache()

    await initReq({
      cache,
      configPromise: config,
      importMap,
      key: 'initPage',
      serverAdapter,
    })

    expect(cache.getPartial).toHaveBeenCalledOnce()
    expect(cache.getRequest).toHaveBeenCalledWith(expect.any(Function), 'initPage')
  })

  it('should reject a cache without a request key', async () => {
    await expect(
      initReq({
        cache: createExecutingCache(),
        configPromise: config,
        importMap,
        serverAdapter,
      }),
    ).rejects.toThrow('initReq requires a key when cache is provided')
  })

  it('should enable cron and forward canSetHeaders to auth strategies', async () => {
    await initReq({
      canSetHeaders: true,
      configPromise: config,
      importMap,
      serverAdapter,
    })

    expect(getPayload).toHaveBeenCalledWith({
      config,
      cron: true,
      importMap,
    })
    expect(authenticate).toHaveBeenCalledWith(
      expect.objectContaining({
        canSetHeaders: true,
        headers,
        payload,
      }),
    )
  })

  it('should clone req and req.context before returning cached state', async () => {
    const cache = createReusingCache()
    const args = {
      cache,
      configPromise: config,
      importMap,
      key: 'initPage',
      overrides: {
        req: {
          context: {
            source: 'cached',
          },
        },
      },
      serverAdapter,
    }
    const first = await initReq(args)
    first.req.context.source = 'mutated'

    const second = await initReq(args)

    expect(first.req).not.toBe(second.req)
    expect(first.req.context).not.toBe(second.req.context)
    expect(second.req.context).toEqual({
      source: 'cached',
    })
  })
})
