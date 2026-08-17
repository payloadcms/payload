import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('fs/promises', () => ({
  default: {
    stat: vi.fn(),
  },
}))

vi.mock('file-type', () => ({
  fileTypeFromFile: vi.fn(),
}))

vi.mock('../fetchAPI-stream-file/index.js', () => ({
  streamFile: vi.fn(),
}))

import { fileTypeFromFile } from 'file-type'
import fsPromises from 'fs/promises'

import type { Collection } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'

import { streamFile } from '../fetchAPI-stream-file/index.js'
import { retrieveFileResponse } from './getFile.js'

const FILE_SIZE = 1000

const makeCollection = (uploadOverrides: Record<string, unknown> = {}): Collection =>
  ({
    config: {
      slug: 'test-media',
      upload: {
        staticDir: '/tmp/test-media-fixture',
        ...uploadOverrides,
      },
    },
  }) as unknown as Collection

const makeReq = (rangeHeader: null | string = null): PayloadRequest =>
  ({
    headers: new Headers(rangeHeader ? { range: rangeHeader } : {}),
    payload: {
      config: { cors: '*' },
      logger: { error: vi.fn() },
    },
  }) as unknown as PayloadRequest

describe('retrieveFileResponse', () => {
  beforeEach(() => {
    vi.mocked(fsPromises.stat).mockResolvedValue({ size: FILE_SIZE } as never)
    vi.mocked(fileTypeFromFile).mockResolvedValue({ ext: 'png', mime: 'image/png' } as never)
    vi.mocked(streamFile).mockReturnValue(new ReadableStream())
  })

  it('should call each handler in declaration order, threading operation through params, and return the first Response result', async () => {
    const handler1 = vi.fn().mockResolvedValue(null)
    const handler2 = vi.fn().mockResolvedValue(new Response('handled'))
    const collection = makeCollection({ handlers: [handler1, handler2] })
    const req = makeReq()

    const response = await retrieveFileResponse({
      collection,
      doc: { id: '1' },
      filename: 'logo.png',
      operation: 'transform',
      req,
    })

    expect(handler1).toHaveBeenCalledWith(
      req,
      expect.objectContaining({ params: expect.objectContaining({ operation: 'transform' }) }),
    )
    expect(handler2).toHaveBeenCalledWith(
      req,
      expect.objectContaining({ params: expect.objectContaining({ operation: 'transform' }) }),
    )
    expect(await response.text()).toBe('handled')
    expect(fsPromises.stat).not.toHaveBeenCalled()
  })

  it('should default operation to "read" for handlers when omitted', async () => {
    const handler = vi.fn().mockResolvedValue(new Response('handled'))
    const collection = makeCollection({ handlers: [handler] })
    const req = makeReq()

    await retrieveFileResponse({ collection, doc: { id: '1' }, filename: 'logo.png', req })

    expect(handler).toHaveBeenCalledWith(
      req,
      expect.objectContaining({ params: expect.objectContaining({ operation: 'read' }) }),
    )
  })

  it('should fall back to local disk when no handler returns a Response', async () => {
    const collection = makeCollection()
    const req = makeReq()

    const response = await retrieveFileResponse({
      collection,
      doc: { id: '1' },
      filename: 'logo.png',
      req,
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/png')
    expect(response.headers.get('Content-Length')).toBe(String(FILE_SIZE))
  })

  it('should honor an incoming Range header when operation is "read" (regression)', async () => {
    const collection = makeCollection()
    const req = makeReq('bytes=0-99')

    const response = await retrieveFileResponse({
      collection,
      doc: { id: '1' },
      filename: 'logo.png',
      operation: 'read',
      req,
    })

    expect(response.status).toBe(206)
    expect(response.headers.get('Content-Range')).toBe(`bytes 0-99/${FILE_SIZE}`)
  })

  it('should ignore an incoming Range header when operation is "transform"', async () => {
    const collection = makeCollection()
    const req = makeReq('bytes=0-99')

    const response = await retrieveFileResponse({
      collection,
      doc: { id: '1' },
      filename: 'logo.png',
      operation: 'transform',
      req,
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Range')).toBeNull()
    expect(response.headers.get('Content-Length')).toBe(String(FILE_SIZE))
  })

  it('should call modifyResponseHeaders when operation is "read" (regression)', async () => {
    const modifyResponseHeaders = vi.fn(({ headers }) => headers)
    const collection = makeCollection({ modifyResponseHeaders })
    const req = makeReq()

    await retrieveFileResponse({
      collection,
      doc: { id: '1' },
      filename: 'logo.png',
      operation: 'read',
      req,
    })

    expect(modifyResponseHeaders).toHaveBeenCalledTimes(1)
  })

  it('should not call modifyResponseHeaders when operation is "transform"', async () => {
    const modifyResponseHeaders = vi.fn(({ headers }) => headers)
    const collection = makeCollection({ modifyResponseHeaders })
    const req = makeReq()

    await retrieveFileResponse({
      collection,
      doc: { id: '1' },
      filename: 'logo.png',
      operation: 'transform',
      req,
    })

    expect(modifyResponseHeaders).not.toHaveBeenCalled()
  })

  it('should add CORS headers when operation is "read" (regression)', async () => {
    const collection = makeCollection()
    const req = makeReq()

    const response = await retrieveFileResponse({
      collection,
      doc: { id: '1' },
      filename: 'logo.png',
      operation: 'read',
      req,
    })

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })

  it('should not add CORS headers when operation is "transform"', async () => {
    const collection = makeCollection()
    const req = makeReq()

    const response = await retrieveFileResponse({
      collection,
      doc: { id: '1' },
      filename: 'logo.png',
      operation: 'transform',
      req,
    })

    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })

  it("should let modifyResponseHeaders override the CORS 'Access-Control-Allow-Origin' header on the existing serve path (regression, Correction 10)", async () => {
    const modifyResponseHeaders = vi.fn(({ headers }: { headers: Headers }) => {
      headers.set('Access-Control-Allow-Origin', 'https://custom.example.com')
      return headers
    })
    const collection = makeCollection({ modifyResponseHeaders })
    const req = makeReq()
    req.payload.config = { cors: '*' } as never

    const response = await retrieveFileResponse({
      collection,
      doc: { id: '1' },
      filename: 'logo.png',
      operation: 'read',
      req,
    })

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://custom.example.com')
  })

  it('should reject a filename that resolves outside the static directory, regardless of operation', async () => {
    const collection = makeCollection()
    const req = makeReq()

    await expect(
      retrieveFileResponse({
        collection,
        doc: { id: '1' },
        filename: '../../etc/passwd',
        operation: 'transform',
        req,
      }),
    ).rejects.toThrow()
  })
})
