import type { I18nClient } from '@payloadcms/translations'
import type { ImportMap } from '../cli/commands/generateImportMap/generateImportMap.js'
import type { SanitizedConfig } from '../config/types.js'
import type { Payload } from '../index.js'
import type { ServerAdapter } from './adapters/server.js'
import type { InitReqCache, InitReqPartialResult } from './initReq.js'
import type { InitReqResult } from './functions/index.js'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { initReq } from './initReq.js'

const {
  applyUserReadAccess,
  findPreference,
  getAccessResults,
  getPayload,
  initI18n,
  updatePreference,
} = vi.hoisted(() => ({
  applyUserReadAccess: vi.fn(),
  findPreference: vi.fn(),
  getAccessResults: vi.fn(),
  getPayload: vi.fn(),
  initI18n: vi.fn(),
  updatePreference: vi.fn(),
}))

vi.mock('../auth/applyUserReadAccess.js', () => ({
  applyUserReadAccess,
}))

vi.mock('../preferences/operations/findOne.js', () => ({
  findOne: findPreference,
}))

vi.mock('../preferences/operations/update.js', () => ({
  update: updatePreference,
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
  admin: {
    user: 'users',
  },
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

const localizedConfig = {
  ...config,
  localization: {
    defaultLocale: 'en',
    locales: [
      { code: 'en', label: 'English' },
      { code: 'es', label: 'Spanish' },
    ],
  },
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
  collections: {
    users: {
      config: {
        auth: {
          depth: 1,
        },
      },
    },
  },
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
  getPartial: vi.fn((createPartialResult: () => Promise<InitReqPartialResult>) =>
    createPartialResult(),
  ),
  getRequest: vi.fn((createRequestResult: () => Promise<InitReqResult>) => createRequestResult()),
})

const createReusingCache = (): InitReqCache => {
  const localeResults: Array<{
    cacheArgs: unknown[]
    result: Pick<InitReqResult, 'locale'>
  }> = []
  let partialResult: InitReqPartialResult | undefined
  const requestResults: Array<{
    cacheArgs: unknown[]
    key: string
    result: InitReqResult
  }> = []

  return {
    getLocale: vi.fn(async (resolveLocale, ...cacheArgs) => {
      const cached = localeResults.find(
        (entry) =>
          entry.cacheArgs.length === cacheArgs.length &&
          entry.cacheArgs.every((arg, index) => arg === cacheArgs[index]),
      )

      if (cached) {
        return cached.result
      }

      const result = await resolveLocale()
      localeResults.push({ cacheArgs, result })

      return result
    }),
    getPartial: vi.fn(async (createPartialResult) => {
      partialResult ??= await createPartialResult()
      return partialResult
    }),
    getRequest: vi.fn(async (createRequestResult, key, ...cacheArgs) => {
      const cached = requestResults.find(
        (entry) =>
          entry.key === key &&
          entry.cacheArgs.length === cacheArgs.length &&
          entry.cacheArgs.every((arg, index) => arg === cacheArgs[index]),
      )

      if (cached) {
        return cached.result
      }

      const result = await createRequestResult()
      requestResults.push({ cacheArgs, key, result })

      return result
    }),
  }
}

describe('initReq', () => {
  beforeEach(() => {
    applyUserReadAccess.mockReset().mockImplementation(async ({ user }) => ({
      collection: user.collection,
      id: user.id,
    }))
    authenticate.mockClear()
    findPreference.mockReset().mockResolvedValue(null)
    getAccessResults.mockReset().mockResolvedValue(permissions)
    getPayload.mockReset().mockResolvedValue(payload)
    initI18n.mockReset().mockResolvedValue(i18n)
    updatePreference.mockReset()
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

  it('should persist an authenticated request locale', async () => {
    getPayload.mockResolvedValue({ ...payload, config: localizedConfig })

    const result = await initReq({
      configPromise: localizedConfig,
      importMap,
      requestURL: 'https://example.com/admin?locale=es',
      serverAdapter,
    })

    expect(result.locale).toMatchObject({ code: 'es' })
    expect(result.req.locale).toBe('es')
    expect(updatePreference).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'locale',
        value: 'es',
      }),
    )
  })

  it('should ignore a request locale for an anonymous request', async () => {
    authenticate.mockResolvedValueOnce({
      responseHeaders: new Headers(),
      user: null,
    })
    getPayload.mockResolvedValue({ ...payload, config: localizedConfig })

    const result = await initReq({
      configPromise: localizedConfig,
      importMap,
      requestURL: 'https://example.com/admin?locale=es',
      serverAdapter,
    })

    expect(result.locale).toMatchObject({ code: 'en' })
    expect(result.req.locale).toBe('en')
    expect(findPreference).not.toHaveBeenCalled()
    expect(updatePreference).not.toHaveBeenCalled()
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
    expect(cache.getRequest).toHaveBeenCalledWith(expect.any(Function), 'initPage', undefined)
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

  it('should keep the complete req.user and return the user with read access', async () => {
    authenticate.mockResolvedValueOnce({
      responseHeaders: new Headers(),
      user: {
        collection: 'users',
        id: 'user-id',
        role: 'admin',
      },
    })

    const result = await initReq({ configPromise: config, importMap, serverAdapter })

    expect(result.req.user).toHaveProperty('role', 'admin')
    expect(result.user).toEqual({ collection: 'users', id: 'user-id' })
    expect(getAccessResults).toHaveBeenCalledWith({ req: result.req })
  })

  it('should filter the user for each request cache context', async () => {
    applyUserReadAccess.mockImplementation(async ({ req, user }) => ({
      collection: user.collection,
      id: user.id,
      source: req.context.source,
    }))
    const cache = createReusingCache()
    const args = {
      cache,
      configPromise: config,
      importMap,
      key: 'initPage',
      serverAdapter,
    }

    const first = await initReq({
      ...args,
      overrides: { context: { source: 'first' } },
    })
    const second = await initReq({
      ...args,
      overrides: { context: { source: 'second' } },
    })

    expect(authenticate).toHaveBeenCalledOnce()
    expect(applyUserReadAccess).toHaveBeenCalledTimes(2)
    expect(first.user).toMatchObject({ source: 'first' })
    expect(second.user).toMatchObject({ source: 'second' })
  })

  it('should reuse locale preference resolution across request cache keys', async () => {
    getPayload.mockResolvedValue({ ...payload, config: localizedConfig })
    findPreference.mockResolvedValue({ value: 'es' })
    const cache = createReusingCache()
    const args = {
      cache,
      configPromise: localizedConfig,
      importMap,
      serverAdapter,
    }

    const rootLayoutResult = await initReq({ ...args, key: 'RootLayout' })
    const pageResult = await initReq({ ...args, key: 'initPage' })

    expect(rootLayoutResult.locale).toMatchObject({ code: 'es' })
    expect(pageResult.locale).toMatchObject({ code: 'es' })
    expect(findPreference).toHaveBeenCalledOnce()
  })

  it('should use anonymous access when user read access fails', async () => {
    applyUserReadAccess.mockRejectedValueOnce(new Error('read access failed'))

    const result = await initReq({ configPromise: config, importMap, serverAdapter })

    expect(result.req.user).toBeNull()
    expect(result.user).toBeNull()
    expect(getAccessResults).toHaveBeenCalledWith({ req: result.req })
  })

  it('should preserve an explicit request user override', async () => {
    const result = await initReq({
      configPromise: config,
      importMap,
      overrides: {
        req: {
          user: {
            collection: 'users',
            id: 'override-user',
          },
        },
      },
      serverAdapter,
    })

    expect(result.user).toBe(result.req.user)
    expect(result.user).toMatchObject({ collection: 'users', id: 'override-user' })
    expect(applyUserReadAccess).not.toHaveBeenCalled()
  })

  it('should preserve an explicit null user override', async () => {
    const result = await initReq({
      configPromise: config,
      importMap,
      overrides: {
        user: null,
      },
      serverAdapter,
    })

    expect(result.req.user).toBeNull()
    expect(result.user).toBeNull()
    expect(applyUserReadAccess).not.toHaveBeenCalled()
  })
})
