import { describe, expect, it, vi } from 'vitest'

import type { Payload } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

import { createPayloadRequest } from './createPayloadRequest.js'

describe('createPayloadRequest - URL construction', () => {
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

    const result = await createPayloadRequest({ payload: mockPayload, req })

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

    const result = await createPayloadRequest({
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

    const result = await createPayloadRequest({ payload: payloadWithServerURL, req })

    expect(result.url).toBe('http://actual-request.com/api/test')
    expect(payloadWithServerURL.logger.error).not.toHaveBeenCalled()
  })

  it('should fall back to localhost when neither req.url nor serverURL provided', async () => {
    const req = {}

    const result = await createPayloadRequest({ payload: mockPayload, req })

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

    const result = await createPayloadRequest({
      payload: payloadWithServerURL,
      req,
      urlSuffix: '/api/preview',
    })

    expect(result.url).toContain('/api/preview')
    expect(payloadWithServerURL.logger.error).not.toHaveBeenCalled()
  })

  it('should append urlSuffix to fallback URL when neither req.url nor serverURL provided', async () => {
    const req = {}

    const result = await createPayloadRequest({ payload: mockPayload, req, urlSuffix: '/api/test' })

    expect(result.url).toBe('http://localhost/api/test')
    expect(mockPayload.logger.error).not.toHaveBeenCalled()
  })
})

describe('createPayloadRequest - scoped operation properties', () => {
  const localizedPayload = {
    config: {
      serverURL: undefined,
      i18n: {
        fallbackLanguage: 'en',
        supportedLanguages: { en: {} },
        translations: {},
      },
      localization: {
        defaultLocale: 'en',
        fallbackLocale: true,
        locales: [
          {
            code: 'en',
            label: { en: 'English' },
          },
          {
            code: 'de',
            label: { en: 'German' },
          },
        ],
      },
    },
    logger: {
      error: vi.fn(),
    },
  } as unknown as Payload

  it('should not write the operation locale, fallbackLocale or query depth onto the passed-in req', async () => {
    const callerReq = {
      fallbackLocale: 'en',
      locale: 'en',
      query: {
        draft: 'true',
      },
      user: null,
    }

    const operationReq = await createPayloadRequest({
      // simulate a nested Local API call from a hook on the caller's req
      depth: 0,
      fallbackLocale: false,
      locale: 'de',
      payload: localizedPayload,
      req: callerReq,
    })

    // the caller's object is untouched by the nested operation
    expect(callerReq.locale).toBe('en')
    expect(callerReq.fallbackLocale).toBe('en')
    expect(callerReq.query).toEqual({ draft: 'true' })

    // while the nested operation still gets what it asked for
    expect(operationReq.locale).toBe('de')
    expect(operationReq.fallbackLocale).toBe(false)
    expect(operationReq.query).toEqual({ draft: 'true', depth: 0 })
  })

  it('should not leak the operation values onto a caller req that has none of them', async () => {
    const callerReq = {
      query: {
        draft: 'false',
        where: {},
      },
    }

    const operationReq = await createPayloadRequest({
      depth: 2,
      locale: 'de',
      payload: localizedPayload,
      req: callerReq,
    })

    expect(Object.hasOwn(callerReq, 'locale')).toBe(false)
    expect(Object.hasOwn(callerReq, 'fallbackLocale')).toBe(false)
    expect(callerReq.query).toEqual({ draft: 'false', where: {} })

    expect(operationReq.locale).toBe('de')
    expect(operationReq.query).toEqual({ draft: 'false', where: {}, depth: 2 })
  })

  it('should still inherit the caller locale when the nested call passes none', async () => {
    const callerReq = {
      locale: 'de',
      query: {},
    }

    const operationReq = await createPayloadRequest({
      payload: localizedPayload,
      req: callerReq,
    })

    // the nested operation reads the caller's locale
    expect(operationReq.locale).toBe('de')
    // and the default locale is not written back onto the caller
    expect(callerReq.locale).toBe('de')
  })
})

describe('createPayloadRequest - request identity', () => {
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

  it('should stay comparable to a plain copy of itself', async () => {
    const result = await createPayloadRequest({ payload: mockPayload, req: {} })

    // the request must not look like a different kind of object than the plain
    // object it stands for: a comparison of two objects compares their
    // constructors and their function properties before their values
    expect(result.constructor).toBe(Object)
    expect(result).toStrictEqual({ ...result })
  })

  it('should return the same method on every read', async () => {
    const result = await createPayloadRequest({ payload: mockPayload, req: {} })

    expect(result.t).toBe(result.t)
  })

  it('should see a method that was replaced on the request', async () => {
    const req = {
      t: () => 'first',
    }

    const result = await createPayloadRequest({
      payload: mockPayload,
      req: req as unknown as Partial<PayloadRequest>,
    })

    result.t = (() => 'second') as typeof result.t

    expect(result.t()).toBe('second')
  })

  it('should keep the web Request methods callable', async () => {
    const request = new Request('http://example.com/api/test', {
      body: 'hello',
      method: 'POST',
    })

    const result = await createPayloadRequest({
      payload: mockPayload,
      req: request as unknown as Partial<PayloadRequest>,
    })

    // web Request methods brand-check `this`, so they only work when the
    // request underneath them is the receiver
    expect(await result.text()).toBe('hello')
  })
})
