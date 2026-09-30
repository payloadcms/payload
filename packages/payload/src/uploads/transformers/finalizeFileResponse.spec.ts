import { describe, expect, it, vi } from 'vitest'

import type { Collection } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'

import { uploadContentSecurityPolicy } from '../uploadContentSecurityPolicy.js'
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

  it('should not let modifyResponseHeaders remove the upload CSP header from an SVG response', async () => {
    const modifyResponseHeaders = vi.fn(({ headers }: { headers: Headers }) => {
      headers.delete('Content-Security-Policy')
      return headers
    })
    const collection = makeCollection({ modifyResponseHeaders })
    const response = new Response('<svg></svg>', {
      headers: { 'Content-Type': 'image/svg+xml' },
    })

    const result = await finalizeFileResponse({ collection, req: makeReq(), response })

    expect(result.headers.get('Content-Security-Policy')).toBe(uploadContentSecurityPolicy)
  })

  it.each([
    'image/svg+xml; charset=utf-8',
    'Image/SVG+XML',
    'application/xhtml+xml',
    'application/xml',
    'text/xml',
    'application/rss+xml',
  ])('should apply the upload CSP header to a %s response', async (contentType) => {
    const collection = makeCollection()
    const response = new Response('<root />', { headers: { 'Content-Type': contentType } })

    const result = await finalizeFileResponse({ collection, req: makeReq(), response })

    expect(result.headers.get('Content-Security-Policy')).toBe(uploadContentSecurityPolicy)
  })

  it('should apply the upload CSP header when modifyResponseHeaders sets an XML content type', async () => {
    const modifyResponseHeaders = vi.fn(({ headers }: { headers: Headers }) => {
      headers.set('Content-Type', 'application/xhtml+xml')
      return headers
    })
    const collection = makeCollection({ modifyResponseHeaders })
    const response = new Response('bytes', { headers: { 'Content-Type': 'image/png' } })

    const result = await finalizeFileResponse({ collection, req: makeReq(), response })

    expect(result.headers.get('Content-Security-Policy')).toBe(uploadContentSecurityPolicy)
  })

  it('should keep the upload CSP header when modifyResponseHeaders relabels an XML response', async () => {
    const modifyResponseHeaders = vi.fn(({ headers }: { headers: Headers }) => {
      headers.set('Content-Type', 'image/png')
      return headers
    })
    const collection = makeCollection({ modifyResponseHeaders })
    const response = new Response('<svg></svg>', {
      headers: { 'Content-Type': 'image/svg+xml' },
    })

    const result = await finalizeFileResponse({ collection, req: makeReq(), response })

    expect(result.headers.get('Content-Security-Policy')).toBe(uploadContentSecurityPolicy)
  })

  it('should not weaken the upload CSP header on a passed-through SVG source response', async () => {
    const collection = makeCollection()
    const response = new Response('<svg></svg>', {
      headers: {
        'Content-Security-Policy': uploadContentSecurityPolicy,
        'Content-Type': 'image/svg+xml',
      },
    })

    const result = await finalizeFileResponse({ collection, req: makeReq(), response })

    expect(result.headers.get('Content-Security-Policy')).toBe(uploadContentSecurityPolicy)
  })

  it('should not add a CSP header to a non-XML response', async () => {
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
})
