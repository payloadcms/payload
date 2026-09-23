import type { I18nClient } from '@payloadcms/translations'

import type { Payload, PayloadRequest, SanitizedConfig } from '../index.js'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { executeAuthStrategies } from '../auth/executeAuthStrategies.js'
import { getPayload } from '../index.js'
import { addLocalesToRequestFromData } from './addLocalesToRequest.js'
import { createPayloadReq } from './createPayloadReq.js'
import { createPayloadReqFromWebRequest } from './createPayloadReqFromWebRequest.js'

const { initI18n } = vi.hoisted(() => ({
  initI18n: vi.fn(),
}))

vi.mock('@payloadcms/translations', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@payloadcms/translations')>()

  return {
    ...actual,
    initI18n,
  }
})

vi.mock('../auth/executeAuthStrategies.js', () => ({
  executeAuthStrategies: vi.fn(),
}))

vi.mock('../index.js', () => ({
  getPayload: vi.fn(),
}))

vi.mock('./createPayloadReq.js', () => ({
  createPayloadReq: vi.fn(),
}))

const config = {
  cookiePrefix: 'payload',
  graphQL: {
    disable: false,
  },
  i18n: {
    fallbackLanguage: 'en',
    supportedLanguages: {
      en: {},
    },
  },
  localization: {
    defaultLocale: 'en',
    fallback: true,
    localeCodes: ['en', 'de'],
    locales: [
      { code: 'en', label: 'English' },
      { code: 'de', label: 'German' },
    ],
  },
  routes: {
    api: '/api',
    graphQL: '/graphql',
  },
} as SanitizedConfig

const i18n = {
  language: 'en',
  t: (key: string) => key,
  translations: {},
} as unknown as I18nClient

const payload = {
  config,
} as unknown as Payload

const useRealCreatePayloadReq = async () => {
  const actual =
    await vi.importActual<typeof import('./createPayloadReq.js')>('./createPayloadReq.js')

  vi.mocked(createPayloadReq).mockImplementation(actual.createPayloadReq)
}

describe('createPayloadReqFromWebRequest', () => {
  beforeEach(() => {
    vi.mocked(getPayload).mockReset().mockResolvedValue(payload)
    vi.mocked(createPayloadReq)
      .mockReset()
      .mockImplementation(async ({ req }) => req as PayloadRequest)
    vi.mocked(executeAuthStrategies).mockReset().mockResolvedValue({
      responseHeaders: undefined,
      user: null,
    })
    initI18n.mockReset().mockResolvedValue(i18n)
  })

  it('initializes the original Web Request through createPayloadReq before authentication', async () => {
    const request = new Request('http://localhost/api/posts?locale=en&depth=2')

    const result = await createPayloadReqFromWebRequest({ config, request })

    expect(createPayloadReq).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: 'en',
        payload,
        req: request,
      }),
    )
    expect((request as PayloadRequest).i18n).toBe(i18n)
    expect((request as PayloadRequest).query).toEqual({ depth: '2', locale: 'en' })
    expect(executeAuthStrategies).toHaveBeenCalledWith(expect.objectContaining({ req: request }))
    expect(vi.mocked(createPayloadReq).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(executeAuthStrategies).mock.invocationCallOrder[0],
    )
    expect(result).toBe(request)
  })

  it.each([
    ['http://localhost/api/graphql', 'GraphQL'],
    ['http://localhost/api/posts', 'REST'],
  ] as const)('assigns %s requests to the %s API', async (url, payloadAPI) => {
    const request = new Request(url)

    const result = await createPayloadReqFromWebRequest({ config, request })

    expect(result.payloadAPI).toBe(payloadAPI)
  })

  it('parses nested query values and assigns route params', async () => {
    const request = new Request(
      'http://localhost/api/posts?where[title][equals]=Hello&tags[]=news&tags[]=featured',
    )

    const result = await createPayloadReqFromWebRequest({
      config,
      params: { collection: 'posts' },
      request,
    })

    expect(result.query).toEqual({
      tags: ['news', 'featured'],
      where: { title: { equals: 'Hello' } },
    })
    expect(result.routeParams).toEqual({ collection: 'posts' })
  })

  it('assigns authentication response headers and user', async () => {
    const request = new Request('http://localhost/api/posts')
    const responseHeaders = new Headers({ 'x-auth': 'authenticated' })
    const user = { collection: 'users', id: 'user-id' }

    vi.mocked(executeAuthStrategies).mockResolvedValue({ responseHeaders, user })

    const result = await createPayloadReqFromWebRequest({ config, request })

    expect(result.responseHeaders).toBe(responseHeaders)
    expect(result.user).toBe(user)
  })

  it('passes sanitized fallback locale state to common request initialization', async () => {
    const request = new Request('http://localhost/api/posts?locale=de&fallbackLocale=unsupported')

    await createPayloadReqFromWebRequest({ config, request })

    expect(createPayloadReq).toHaveBeenCalledWith(
      expect.objectContaining({
        fallbackLocale: false,
        locale: 'de',
      }),
    )
  })

  it('preserves parsed locale fields when localization is disabled', async () => {
    const unlocalizedConfig = {
      ...config,
      localization: false,
    } as SanitizedConfig
    const unlocalizedPayload = {
      config: unlocalizedConfig,
    } as unknown as Payload

    vi.mocked(getPayload).mockResolvedValue(unlocalizedPayload)
    await useRealCreatePayloadReq()

    const result = await createPayloadReqFromWebRequest({
      config: unlocalizedConfig,
      request: new Request('http://localhost/api/posts?locale=de&fallbackLocale=en'),
    })

    expect(result.locale).toBe('de')
    expect(result.fallbackLocale).toBe('en')
  })

  it('allows a body locale when URL locale is absent and fallback is disabled', async () => {
    const noFallbackConfig = {
      ...config,
      localization: {
        ...config.localization,
        fallback: false,
      },
    } as SanitizedConfig
    const noFallbackPayload = {
      config: noFallbackConfig,
    } as unknown as Payload

    vi.mocked(getPayload).mockResolvedValue(noFallbackPayload)
    await useRealCreatePayloadReq()

    const result = await createPayloadReqFromWebRequest({
      config: noFallbackConfig,
      request: new Request('http://localhost/api/posts'),
    })

    expect(result.locale).toBeNull()

    result.data = { locale: 'de' }
    addLocalesToRequestFromData(result)

    expect(result.locale).toBe('de')
  })

  it('preserves fallback locale arrays through common request initialization', async () => {
    await useRealCreatePayloadReq()

    const result = await createPayloadReqFromWebRequest({
      config,
      request: new Request(
        'http://localhost/api/posts?locale=de&fallbackLocale[]=en&fallbackLocale[]=de',
      ),
    })

    expect(result.fallbackLocale).toEqual(['en', 'de'])
  })
})
