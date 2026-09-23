import { describe, expect, it, vi } from 'vitest'

import type { Payload, PayloadRequest } from '../index.js'

import { createPayloadReq } from './createPayloadReq.js'

describe('createPayloadReq', () => {
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

    const result = await createPayloadReq({ payload: mockPayload, req })

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

    const result = await createPayloadReq({
      payload: payloadWithServerURL,
      req,
      urlSuffix: '/api',
    })

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

    const result = await createPayloadReq({ payload: payloadWithServerURL, req })

    expect(result.url).toBe('http://actual-request.com/api/test')
    expect(payloadWithServerURL.logger.error).not.toHaveBeenCalled()
  })

  it('should fall back to localhost when neither req.url nor serverURL provided', async () => {
    const req = {}

    const result = await createPayloadReq({ payload: mockPayload, req })

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

    const result = await createPayloadReq({
      payload: payloadWithServerURL,
      req,
      urlSuffix: '/api/preview',
    })

    expect(result.url).toContain('/api/preview')
    expect(payloadWithServerURL.logger.error).not.toHaveBeenCalled()
  })

  it('should append urlSuffix to fallback URL when neither req.url nor serverURL provided', async () => {
    const req = {}

    const result = await createPayloadReq({ payload: mockPayload, req, urlSuffix: '/api/test' })

    expect(result.url).toBe('http://localhost/api/test')
    expect(mockPayload.logger.error).not.toHaveBeenCalled()
  })

  it('returns the supplied request and preserves request-owned state', async () => {
    const headers = new Headers({ existing: 'true' })
    const payloadDataLoader = {} as PayloadRequest['payloadDataLoader']
    const req = {
      context: { fromRequest: true },
      headers,
      payloadAPI: 'REST' as const,
      payloadDataLoader,
      query: { existing: 'value' },
      routeParams: { id: '1' },
      user: null,
      url: 'http://example.com/api/posts',
    } as Partial<PayloadRequest>

    const result = await createPayloadReq({
      context: { fromArgs: true },
      payload: mockPayload,
      req,
    })

    expect(result).toBe(req)
    expect(result.headers).toBe(headers)
    expect(result.payloadAPI).toBe('REST')
    expect(result.payloadDataLoader).toBe(payloadDataLoader)
    expect(result.context).toEqual({ fromRequest: true, fromArgs: true })
    expect(result.query).toEqual({ existing: 'value' })
    expect(result.routeParams).toEqual({ id: '1' })
  })

  describe('localization', () => {
    const localizedPayload = {
      ...mockPayload,
      config: {
        ...mockPayload.config,
        localization: {
          defaultLocale: 'en',
          fallback: true,
          localeCodes: ['en', 'de'],
          locales: [{ code: 'en' }, { code: 'de' }],
        },
      },
    } as unknown as Payload

    it("normalizes localized '*' requests to 'all'", async () => {
      const result = await createPayloadReq({ locale: '*', payload: localizedPayload })

      expect(result.locale).toBe('all')
    })

    it('uses the default locale for localized requests without a locale', async () => {
      const result = await createPayloadReq({ payload: localizedPayload })

      expect(result.locale).toBe('en')
    })

    it('sanitizes unsupported fallback locales for localized requests', async () => {
      const result = await createPayloadReq({
        fallbackLocale: 'fr',
        locale: 'en',
        payload: localizedPayload,
      })

      expect(result.fallbackLocale).toBe(false)
    })

    it('does not assign locale state when localization is disabled', async () => {
      const result = await createPayloadReq({
        fallbackLocale: 'de',
        locale: 'en',
        payload: mockPayload,
      })

      expect(result.locale).toBeUndefined()
      expect(result.fallbackLocale).toBeUndefined()
    })
  })
})
