import type { PayloadRequest } from '../types/index.js'

import { afterEach, describe, expect, test, vitest } from 'vitest'

import { downloadFileToBuffer } from './downloadFileToBuffer.js'

const successfulResponse = () =>
  new Response('ok', {
    headers: {
      'content-length': '2',
      'content-type': 'text/plain',
    },
    status: 200,
  })

const createRequest = ({
  cors = [],
  csrf = [],
  host = 'request.example.com',
  origin = 'https://request.example.com',
  serverURL = '',
}: {
  cors?: string[]
  csrf?: string[]
  host?: string
  origin?: string
  serverURL?: string
} = {}): PayloadRequest =>
  ({
    headers: new Headers({
      cookie: 'payload-token=123; other-cookie=456',
      host,
      origin,
    }),
    payload: {
      config: {
        cookiePrefix: 'payload',
        cors,
        csrf,
        serverURL,
      },
      logger: {
        warn: vitest.fn(),
      },
    },
    protocol: 'https',
    url: origin,
  }) as unknown as PayloadRequest

describe('downloadFileToBuffer', () => {
  afterEach(() => {
    vitest.restoreAllMocks()
  })

  test('should resolve relative URLs against the configured server origin', async () => {
    const fetchMock = vitest.spyOn(global, 'fetch').mockResolvedValue(successfulResponse())
    const req = createRequest({
      host: 'alternate.example.com',
      origin: 'https://alternate.example.com',
      serverURL: 'https://configured.example.com',
    })

    await downloadFileToBuffer({
      data: { url: '/asset.txt' },
      req,
      uploadConfig: { skipSafeFetch: true },
    })

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://configured.example.com/asset.txt')
    expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('cookie')).toContain(
      'payload-token=123',
    )
  })

  test('should filter authentication cookies for an untrusted relative URL', async () => {
    const fetchMock = vitest.spyOn(global, 'fetch').mockResolvedValue(successfulResponse())
    const req = createRequest()

    await downloadFileToBuffer({
      data: { url: '/asset.txt' },
      req,
      uploadConfig: { skipSafeFetch: true },
    })

    const cookie = new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('cookie')

    expect(cookie).not.toContain('payload-token=123')
    expect(cookie).toContain('other-cookie=456')
  })

  test('should filter authentication cookies for each cross-origin redirect', async () => {
    const fetchMock = vitest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        new Response(null, {
          headers: { location: 'https://external.example.com/asset.txt' },
          status: 302,
        }),
      )
      .mockResolvedValueOnce(
        new Response(null, {
          headers: { location: 'https://configured.example.com/final.txt' },
          status: 302,
        }),
      )
      .mockResolvedValueOnce(successfulResponse())
    const req = createRequest({ serverURL: 'https://configured.example.com' })

    await downloadFileToBuffer({
      data: { url: '/asset.txt' },
      req,
      uploadConfig: { skipSafeFetch: true },
    })

    const cookies = fetchMock.mock.calls.map(([, init]) => new Headers(init?.headers).get('cookie'))

    expect(cookies[0]).toContain('payload-token=123')
    expect(cookies[1]).not.toContain('payload-token=123')
    expect(cookies[1]).toContain('other-cookie=456')
    expect(cookies[2]).toContain('payload-token=123')
  })

  test('should provide each redirect destination to the header filter', async () => {
    const contexts: Array<{ isSameOrigin: boolean; url: string }> = []
    vitest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        new Response(null, {
          headers: { location: 'https://external.example.com/asset.txt' },
          status: 302,
        }),
      )
      .mockResolvedValueOnce(successfulResponse())
    const req = createRequest({ serverURL: 'https://configured.example.com' })

    await downloadFileToBuffer({
      data: { url: '/asset.txt' },
      req,
      uploadConfig: {
        externalFileHeaderFilter: (headers, context) => {
          contexts.push(context!)
          return headers
        },
        skipSafeFetch: true,
      },
    })

    expect(contexts).toEqual([
      { isSameOrigin: true, url: 'https://configured.example.com/asset.txt' },
      { isSameOrigin: false, url: 'https://external.example.com/asset.txt' },
    ])
  })

  test('should normalize supported absolute URL protocols', async () => {
    const fetchMock = vitest.spyOn(global, 'fetch').mockResolvedValue(successfulResponse())
    const req = createRequest({ serverURL: 'https://configured.example.com' })

    await downloadFileToBuffer({
      data: { url: 'HTTP://files.example.com/asset.txt' },
      req,
      uploadConfig: { skipSafeFetch: true },
    })

    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://files.example.com/asset.txt')
  })

  test.each(['ftp://files.example.com/asset.txt', 'data:text/plain,asset'])(
    'should reject unsupported URL protocol %s',
    async (url) => {
      vitest.spyOn(global, 'fetch').mockResolvedValue(successfulResponse())
      const req = createRequest({ serverURL: 'https://configured.example.com' })

      await expect(
        downloadFileToBuffer({
          data: { url },
          req,
          uploadConfig: { skipSafeFetch: true },
        }),
      ).rejects.toMatchObject({ status: 400 })
    },
  )
})
