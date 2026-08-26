import { describe, expect, it, vi } from 'vitest'

import type { Collection } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'

import { finalizeFileResponse } from './finalizeFileResponse.js'

const makeCollection = (uploadOverrides: Record<string, unknown> = {}): Collection =>
  ({
    config: {
      slug: 'test-media',
      upload: uploadOverrides,
    },
  }) as unknown as Collection

const makeReq = (overrides: Record<string, unknown> = {}): PayloadRequest =>
  ({
    method: 'GET',
    payload: { config: { cors: '*' } },
    ...overrides,
  }) as unknown as PayloadRequest

describe('finalizeFileResponse', () => {
  it('should call modifyResponseHeaders exactly once', async () => {
    const modifyResponseHeaders = vi.fn(({ headers }) => headers)
    const collection = makeCollection({ modifyResponseHeaders })
    const response = new Response('bytes', { headers: { 'Content-Type': 'image/png' } })

    await finalizeFileResponse({ collection, req: makeReq(), response })

    expect(modifyResponseHeaders).toHaveBeenCalledTimes(1)
  })

  it("should not let modifyResponseHeaders override the mandatory CORS 'Access-Control-Allow-Origin' header", async () => {
    const modifyResponseHeaders = vi.fn(({ headers }: { headers: Headers }) => {
      headers.set('Access-Control-Allow-Origin', 'https://attacker.example.com')
      return headers
    })
    const collection = makeCollection({ modifyResponseHeaders })
    const response = new Response('bytes', { headers: { 'Content-Type': 'image/png' } })

    const result = await finalizeFileResponse({ collection, req: makeReq(), response })

    expect(result.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })

  it('should not let modifyResponseHeaders remove the SVG script-blocking CSP header', async () => {
    const modifyResponseHeaders = vi.fn(({ headers }: { headers: Headers }) => {
      headers.delete('Content-Security-Policy')
      return headers
    })
    const collection = makeCollection({ modifyResponseHeaders })
    const response = new Response('<svg></svg>', {
      headers: { 'Content-Type': 'image/svg+xml' },
    })

    const result = await finalizeFileResponse({ collection, req: makeReq(), response })

    expect(result.headers.get('Content-Security-Policy')).toBe("script-src 'none'")
  })

  it('should not add a CSP header for a non-SVG response', async () => {
    const collection = makeCollection()
    const response = new Response('bytes', { headers: { 'Content-Type': 'image/png' } })

    const result = await finalizeFileResponse({ collection, req: makeReq(), response })

    expect(result.headers.get('Content-Security-Policy')).toBeNull()
  })

  it('should return no body for a HEAD request while preserving status and headers', async () => {
    const collection = makeCollection()
    const response = new Response('bytes', {
      headers: { 'Content-Type': 'image/png' },
      status: 200,
    })

    const result = await finalizeFileResponse({
      collection,
      req: makeReq({ method: 'HEAD' }),
      response,
    })

    expect(await result.text()).toBe('')
    expect(result.status).toBe(200)
    expect(result.headers.get('Content-Type')).toBe('image/png')
  })

  it('should preserve the response status', async () => {
    const collection = makeCollection()
    const response = new Response('nope', { status: 403 })

    const result = await finalizeFileResponse({ collection, req: makeReq(), response })

    expect(result.status).toBe(403)
  })
})
