import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ResolvedCloudinaryConfig } from './types.js'

import { resolveCloudinaryDynamicDefaults } from './cloudinaryTransformer.js'
import { createHandleRequest } from './handleRequest.js'

const config: ResolvedCloudinaryConfig = {
  api_key: 'key',
  api_secret: 'secret',
  cloud_name: 'my-cloud',
  secure: true,
}

const resolveSourceURL = () => 'https://cdn.example.com/media/photo.png'

const createHandler = (delivery: 'proxy' | 'redirect' = 'proxy') =>
  createHandleRequest({
    config,
    delivery,
    dynamicDefaults: resolveCloudinaryDynamicDefaults(),
    resolveSourceURL,
  })

const createArgs = ({ method = 'GET', query = 'width=400' } = {}) => ({
  collectionSlug: 'media',
  documentID: '1',
  filename: 'photo.png',
  getSourceFile: vi.fn(),
  mimeType: 'image/png',
  req: {
    headers: new Headers(),
    method,
    searchParams: new URLSearchParams(query),
  } as never,
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('createHandleRequest', () => {
  it('should pass an ordinary read through untouched', async () => {
    const args = createArgs({ query: 'depth=1' })

    expect(await createHandler()(args)).toStrictEqual({ status: 'continue' })
    expect(args.getSourceFile).not.toHaveBeenCalled()
  })

  it('should return 400 for a malformed parameter', async () => {
    const result = await createHandler()(createArgs({ query: 'width=abc' }))

    expect(result.status).toBe('complete')
    expect(result.response!.status).toBe(400)
  })

  it('should return 416 for a range request', async () => {
    const args = createArgs()
    args.req.headers.set('range', 'bytes=0-99')

    const result = await createHandler()(args)

    expect(result.status).toBe('complete')
    expect(result.response!.status).toBe(416)
  })

  it('should redirect to the Cloudinary URL in redirect mode', async () => {
    const result = await createHandler('redirect')(createArgs())

    expect(result.status).toBe('complete')
    expect(result.response!.status).toBe(302)
    expect(result.response!.headers.get('location')).toBe(
      'https://res.cloudinary.com/my-cloud/image/fetch/c_scale,q_auto,w_400/https://cdn.example.com/media/photo.png',
    )
  })

  it('should stream the transformed bytes in proxy mode', async () => {
    const fetchMock = vi.fn(
      async () => new Response('bytes', { headers: { 'content-type': 'image/png' }, status: 200 }),
    )

    vi.stubGlobal('fetch', fetchMock)
    const args = createArgs()
    const result = await createHandler()(args)

    expect(result.status).toBe('continue')
    expect(result.response!.status).toBe(200)
    expect(await result.response!.text()).toBe('bytes')
    expect(result.response!.headers.get('Content-Type')).toBe('image/png')
    // Cloudinary pulls the source itself, so the single-use handle stays available.
    expect(args.getSourceFile).not.toHaveBeenCalled()
  })

  it('should surface a Cloudinary failure status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 404, statusText: 'Not Found' })),
    )

    const result = await createHandler()(createArgs())

    expect(result.status).toBe('complete')
    expect(result.response!.status).toBe(404)
  })

  it('should answer a HEAD request without a body', async () => {
    const fetchMock = vi.fn(
      async () => new Response(null, { headers: { 'content-type': 'image/png' }, status: 200 }),
    )

    vi.stubGlobal('fetch', fetchMock)
    const result = await createHandler()(createArgs({ method: 'HEAD' }))

    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'HEAD' })
    expect(result.response!.body).toBeNull()
  })
})
