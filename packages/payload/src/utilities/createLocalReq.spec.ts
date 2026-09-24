import { describe, expect, it, vi } from 'vitest'

import type { Payload } from '../index.js'

import { createLocalReq } from './createLocalReq.js'

describe('createLocalReq - URL construction', () => {
  const mockPayload = {
    config: {
      serverURL: undefined,
      i18n: {
        fallbackLanguage: 'en',
        supportedLanguages: { en: {} },
        translations: {},
      },
      localization: undefined,
    },
    logger: {
      error: vi.fn(),
    },
  } as unknown as Payload

  it('should use req.url when provided and serverURL is undefined', async () => {
    const req = {
      url: 'http://example.com/api/test',
    }

    const result = await createLocalReq({ req }, mockPayload)

    expect(result.url).toBe('http://example.com/api/test')
    expect(mockPayload.logger.error).not.toHaveBeenCalled()
  })

  it('should use serverURL when req.url is not provided', async () => {
    const payloadWithServerURL = {
      config: {
        serverURL: 'http://configured-server.com',
        i18n: {
          fallbackLanguage: 'en',
          supportedLanguages: { en: {} },
          translations: {},
        },
        localization: undefined,
      },
      logger: {
        error: vi.fn(),
      },
    } as unknown as Payload

    const req = {}

    const result = await createLocalReq({ req, urlSuffix: '/api' }, payloadWithServerURL)

    expect(result.url).toContain('http://configured-server.com/api')
    expect(payloadWithServerURL.logger.error).not.toHaveBeenCalled()
  })

  it('should prioritize req.url over serverURL', async () => {
    const payloadWithServerURL = {
      config: {
        serverURL: 'http://configured-server.com',
        i18n: {
          fallbackLanguage: 'en',
          supportedLanguages: { en: {} },
          translations: {},
        },
        localization: undefined,
      },
      logger: {
        error: vi.fn(),
      },
    } as unknown as Payload

    const req = {
      url: 'http://actual-request.com/api/test',
    }

    const result = await createLocalReq({ req }, payloadWithServerURL)

    expect(result.url).toBe('http://actual-request.com/api/test')
    expect(payloadWithServerURL.logger.error).not.toHaveBeenCalled()
  })

  it('should fall back to localhost when neither req.url nor serverURL provided', async () => {
    const req = {}

    const result = await createLocalReq({ req }, mockPayload)

    expect(result.url).toBe('http://localhost/')
    expect(mockPayload.logger.error).not.toHaveBeenCalled()
  })

  it('should append urlSuffix to serverURL when used', async () => {
    const payloadWithServerURL = {
      config: {
        serverURL: 'http://configured-server.com',
        i18n: {
          fallbackLanguage: 'en',
          supportedLanguages: { en: {} },
          translations: {},
        },
        localization: undefined,
      },
      logger: {
        error: vi.fn(),
      },
    } as unknown as Payload

    const req = {}

    const result = await createLocalReq({ req, urlSuffix: '/api/preview' }, payloadWithServerURL)

    expect(result.url).toContain('/api/preview')
    expect(payloadWithServerURL.logger.error).not.toHaveBeenCalled()
  })

  it('should append urlSuffix to fallback URL when neither req.url nor serverURL provided', async () => {
    const req = {}

    const result = await createLocalReq({ req, urlSuffix: '/api/test' }, mockPayload)

    expect(result.url).toBe('http://localhost/api/test')
    expect(mockPayload.logger.error).not.toHaveBeenCalled()
  })
})

describe('createLocalReq - locale isolation', () => {
  const localizedPayload = {
    config: {
      admin: { user: 'users' },
      serverURL: undefined,
      i18n: {
        fallbackLanguage: 'en',
        supportedLanguages: { en: {} },
        translations: {},
      },
      localization: {
        defaultLocale: 'en',
        fallback: true,
        localeCodes: ['en', 'es'],
        locales: [{ code: 'en' }, { code: 'es' }],
      },
    },
    logger: {
      error: vi.fn(),
    },
  } as unknown as Payload

  it('should not rewrite the caller req locale when the nested call passes a different locale', async () => {
    const req = {
      i18n: { t: (str: string) => str },
      locale: 'es',
      payloadDataLoader: {},
    }

    const result = await createLocalReq({ locale: 'en', req }, localizedPayload)

    expect(result.locale).toBe('en')
    expect(req.locale).toBe('es')
  })

  it('should not rewrite the caller req fallbackLocale when the nested call passes a locale', async () => {
    const req = {
      fallbackLocale: false,
      i18n: { t: (str: string) => str },
      locale: 'es',
      payloadDataLoader: {},
    }

    const result = await createLocalReq({ locale: 'en', req }, localizedPayload)

    expect(result.fallbackLocale).toBe('en')
    expect(req.fallbackLocale).toBe(false)
  })

  it('should fall back to the caller req locale when the nested call passes no locale', async () => {
    const req = {
      i18n: { t: (str: string) => str },
      locale: 'es',
      payloadDataLoader: {},
    }

    const result = await createLocalReq({ req }, localizedPayload)

    expect(result.locale).toBe('es')
    expect(req.locale).toBe('es')
  })
})
